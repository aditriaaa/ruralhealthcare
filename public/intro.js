// Intro screen navigation
document.addEventListener('DOMContentLoaded', () => {
  const patientBtn = document.getElementById('patientBtn');
  if (patientBtn && patientBtn.tagName !== 'A') {
    patientBtn.onclick = () => {
      window.location.href = '/patient.html';
    };
  }

  const providerBtn = document.getElementById('providerBtn');
  if (providerBtn && providerBtn.tagName !== 'A') {
    providerBtn.onclick = () => {
      window.location.href = '/provider-login.html';
    };
  }
});