import { promisify } from "./utils.js";

const APP_NAMESPACE = {
    owner: "nobody",
    app: 'prometheus_alertmanager',
    sharing: "app",
};

async function fetch_storage_password(splunk_js_sdk_service, realm, name) {
  var storage_passwords_accessor = splunk_js_sdk_service.storagePasswords({});
  storage_passwords_accessor = await promisify(
    storage_passwords_accessor.fetch
  )();

  var storage_passwords = storage_passwords_accessor.list();
  const password_id = realm + ":" + name + ":";

  for (var index = 0; index < storage_passwords.length; index++) {
    if (storage_passwords[index].name === password_id) {
      return storage_passwords[index].properties().clear_password;
    }
  }

  return null;

}

async function write_secret(splunk_js_sdk_service, realm, name, secret) {

  var storage_passwords_accessor = splunk_js_sdk_service.storagePasswords({});
  storage_passwords_accessor = await promisify(
    storage_passwords_accessor.fetch
  )();

  var password_exists = does_storage_password_exist(
    storage_passwords_accessor,
    realm,
    name
  );

  if (password_exists) {
    await delete_storage_password(storage_passwords_accessor, realm, name);
  }

  // wait for password to be deleted
  while (password_exists) {
    storage_passwords_accessor = await promisify(
      storage_passwords_accessor.fetch
    )();

    password_exists = does_storage_password_exist(
      storage_passwords_accessor,
      realm,
      name
    );
  }
  if (secret) {
    await create_storage_password_stanza(
      storage_passwords_accessor,
      realm,
      name,
      secret
    );
  }
}

function does_storage_password_exist(storage_passwords_accessor, realm, name) {
  var storage_passwords = storage_passwords_accessor.list();
  const password_id = realm + ":" + name + ":";

  for (var index = 0; index < storage_passwords.length; index++) {
    if (storage_passwords[index].name === password_id) {
      return true;
    }
  }
  return false;
}

function delete_storage_password(storage_passwords_accessor, realm, name) {
  return promisify(storage_passwords_accessor.del)(
    realm + ":" + name + ":",
    {}
  );
}

function create_storage_password_stanza(
  storage_passwords_accessor,
  realm,
  name,
  secret
) {
  return promisify(storage_passwords_accessor.create)({
    name: name,
    password: secret,
    realm: realm,
  });
}

export {
  write_secret,
  does_storage_password_exist,
  fetch_storage_password,
  APP_NAMESPACE
};
