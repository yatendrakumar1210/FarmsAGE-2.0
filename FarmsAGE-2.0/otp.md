<body>
<script type="text/javascript">
var configuration = {
  widgetId: "366468696f41383532303734",
  tokenAuth: "{token}",
  identifier: "<enter mobile number/email here> (optional)",
  exposeMethods: "<true | false> (optional)",  // When true will expose the methods for OTP verification. Refer 'How it works?' for more details
  success: (data) => {
      // get verified token in response
      console.log('success response', data);
  },
  failure: (error) => {
      // handle error
      console.log('failure reason', error);
  },

};
</script>
<script type="text/javascript">
(function loadOtpScript(urls) {
    let i = 0;
    function attempt() {
        const s = document.createElement('script');
        s.src = urls[i];
        s.async = true;
        s.onload = () => {
            if (typeof window.initSendOTP === 'function') {
                window.initSendOTP(configuration);
            }
        };
        s.onerror = () => {
            i++;
            if (i < urls.length) {
                attempt();
            }
        };
        document.head.appendChild(s);
    }
    attempt();
})([
    'https://verify.msg91.com/otp-provider.js',
    'https://verify.phone91.com/otp-provider.js'
]);
</script>
</body>















  const url = new URL(
    'https://control.msg91.com/api/v5/widget/verifyAccessToken'
  );
  let headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  let body = {
  "authkey": "{Your MSG91 AuthKey}",
  "access-token": "{jwt_token_from_otp_widget}"
}
  fetch(url, {
      method: 'POST',
      headers: headers,
      body:  JSON.stringify(body)
  })
  .then(response => response.json())
  .then(json => console.log(json));
