function get_template() {
  const template_string = `
      <div class='title'>
          <h1>Prometheus Alertmanager</h1>
      </div>
      <div class='setup container'>
          <div class='left'>
              <h2>Setup Properties</h2>
              <div class='field integration_key'>
                  <div class='title'>
                      <h3>Integration Key:</h3>
                      Please specify the Integration Key to be used.
                  </div>
                  </br>
                  <div class='user_input'>
                      <div class='text'>
                          <input type='text' name='param_integration_key' id='param_integration_key' placeholder='a1b2c3d4e5a1b2c3d4e5a1b2c3d4e5ff'></input>
                      </div>
                  </div>
              </div>
              <div class='field integration_url'>
                  <div class='title'>
                      <h3>Integration URL:</h3>
                      OR specify the Integration URL to be used.
                  </div>
                  </br>
                  <div class='user_input'>
                      <div class='text'>
                          <input type='text' name='param_integration_url' id='param_integration_url'></input>
                      </div>
                  </div>
              </div>
              <h2>Complete the Setup</h2>
              <div>
                  Please press the 'Perform Setup' button below to complete the Splunk App setup.
              </div>
              <br/>
              <div>
                  <button name='setup_button' class='setup_button'>
                      Perform Setup
                  </button>
              </div>
              <br/>
              <div class='error output'>
              </div>
          </div>
      </div>
    `;

  return template_string;
}


export { get_template };
