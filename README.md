# Prometheus Alertmanager

## Description
Send your splunk alerts to prometheus alertmanager.

This app is modified based on [PagerDuty App for Splunk](https://splunkbase.splunk.com/app/3013) .

## Installation
1. Download the app package from [Splunkbase](https://splunkbase.splunk.com/app/*/).
2. Install the app on your Splunk instance using one of the following methods:
    - Splunk Web: Go to **Apps** > **Manage Apps** > **Install app from file**.
    - Command line: Run the following command: `splunk install app <path_to_app_package>`.
3. Restart Splunk if prompted.

## Configuration
- Integration URL. Is you alertmanager base url.Eventually the alert will be sent to {Integration URL}/api/v2/alerts
- Integration Key (optional). Actually is basic auth token ( Authorization: {Integration Key} ) .

## Example
If you have already configured "Integration URL" and "Integration Key".

If our search result like this:
```json
{
    "name": "xxx",
    "type": "",
    "hostname": "DESKTOP-xxxxxx",
    "os_type": "Windows 10 Pro",
    "agent_id": "xxxx",
    "create_time": "xxxx",
    "file_path": "xxxpath"
}
```

You can configure "Custom Details" like this:
```json
{"description":"[$result.hostname$] -> [$result.file_path$]"}
```

And the alert we finally sent to alertmanager looked like this.
```json
[
    {
        "labels": {
            "name": "xxx",
            "type": "",
            "hostname": "DESKTOP-xxxxxx",
            "os_type": "Windows 10 Pro",
            "agent_id": "xxxx",
            "create_time": "xxxx",
            "file_path": "xxxpath",
            "alertname": "{your search name}"
        },
        "annotations": {
            "description": "[DESKTOP-xxxxxx] -> [xxxpath]"
        },
        "generatorURL": "{your search URL}"
    }
]
```


