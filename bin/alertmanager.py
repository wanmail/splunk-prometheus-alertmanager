from __future__ import print_function
import os
import subprocess
import sys
import json
import re
import six.moves.urllib.request
import six.moves.urllib.error
import six.moves.urllib.parse
from fnmatch import fnmatch

if sys.version < '3':
    from ConfigParser import ConfigParser
    from StringIO import StringIO
else:
    from configparser import ConfigParser
    from io import StringIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))
import splunklib.client as client


def build_alertmanager_payload(payload):
    labels = payload.get("result")

    generatorURL = payload.get("results_link", "")

    annotations = dict()
    custom_details = payload.get("configuration", dict()).get(
        "custom_details")
    if not custom_details is None:
        try:
            if type(custom_details) is dict:
                annotations = custom_details
            else:
                annotations = json.loads(
                    custom_details)
        except ValueError:
            print("WARN Failed to convert custom details to JSON object",
                  file=sys.stderr)

    if labels.get("alertname") is None:
        labels["alertname"] = payload.get("search_name", "Splunk Alert")

    return [{"labels": labels,
             "annotations": annotations,
             "generatorURL": generatorURL}]


def send_notification(payload):
    settings = payload.get('configuration')
    session_key = str(payload.get('session_key'))

    url = ""
    integration_key = None
    integration_url = None

    service = client.connect(token=session_key, app='prometheus_alertmanager')
    for passwd in service.storage_passwords:
        if passwd.realm is None or passwd.realm.strip() != 'prometheus_alertmanager':
            continue
        if passwd.username == "integration_url":
            integration_url = passwd.clear_password
        if passwd.username == "integration_key":
            integration_key = passwd.clear_password

    # Attempting to set the url from the configs
    if settings.get('integration_url_override'):
        url = settings.get('integration_url_override')
    elif settings.get('integration_key_override'):
        url = settings.get('integration_key_override')
    elif integration_url:
        url = integration_url
    elif settings.get('integration_url'):
        url = settings.get('integration_url')
    elif integration_key:
        url = integration_key
    elif settings.get('integration_key'):
        url = settings.get('integration_key')
    else:
        print(
            "ERROR Integration key or url must be configurated specified.", file=sys.stderr)
        return False

    if url.endswith('/'):
        url = url + "api/v2/alerts"
    else:
        url = url + "/api/v2/alerts"

    body = json.dumps(build_alertmanager_payload(payload))
    body = body.encode('utf-8')
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if integration_key is not None:
        headers["Authorization"] = integration_key

    req = six.moves.urllib.request.Request(
        url, body, headers=headers, method="POST")

    try:
        res = six.moves.urllib.request.urlopen(req)
        body = res.read()
        print("INFO Alertmanager server responded with HTTP status=%d" %
              res.code, file=sys.stderr)
        return 200 <= res.code < 300
    except six.moves.urllib.error.HTTPError as e:
        print("ERROR Error sending message: %s (%s)" %
              (e, str(dir(e))), file=sys.stderr)
        print("ERROR Server response: %s" % e.read(), file=sys.stderr)
        return False


def replace_tokens(payload):
    if not (payload.get('configuration') and payload.get('configuration').get('custom_details')):
        return payload

    custom_details = payload['configuration']['custom_details']

    matches = re.findall("\"__(.*)__\"", custom_details)
    for match in matches:
        # escape all of the quotes
        str = json.dumps(match)
        # replace the underscores
        match = "\"__{0}__\"".format(match)
        # replace the string
        custom_details = custom_details.replace(match, str)

    payload['configuration']['custom_details'] = custom_details

    return payload


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--execute":
        payload = json.loads(sys.stdin.read())
        payload = replace_tokens(payload)
        success = send_notification(payload)

        if not success:
            print("FATAL Failed trying to incident alert", file=sys.stderr)
            sys.exit(2)
        else:
            print("INFO Incident alert notification successfully sent",
                  file=sys.stderr)
    else:
        print("FATAL Unsupported execution mode (expected --execute flag)",
              file=sys.stderr)
        sys.exit(1)
