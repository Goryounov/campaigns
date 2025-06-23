function validateEmail(email) {
  return email.includes('@');
}

function validatePhone(phone) {
  return phone.length >= 10 && /^\d+$/.test(phone);
}

module.exports = {
  validateEmail,
  validatePhone
}