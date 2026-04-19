// Intro screen navigation
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('patientBtn').onclick = () => {
    window.location.href = 'patient.html';
  };

  document.getElementById('providerBtn').onclick = () => {
    window.location.href = 'provider-login.html';
  };
});