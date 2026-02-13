/**
 * Password validation utility
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required']
    };
  }

  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Email validation
 */
export const validateEmail = (email) => {
  if (!email) {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please provide a valid email address'
    };
  }

  return {
    isValid: true
  };
};

/**
 * Role validation
 */
export const validateRole = (role) => {
  const validRoles = ['patient', 'doctor', 'provider', 'admin', 'stakeholder'];
  
  if (!role) {
    return {
      isValid: false,
      error: 'Role is required'
    };
  }

  const normalizedRole = role.toLowerCase();
  
  if (!validRoles.includes(normalizedRole)) {
    return {
      isValid: false,
      error: `Role must be one of: ${validRoles.join(', ')}`
    };
  }

  // Map 'stakeholder' to 'provider' for consistency
  const mappedRole = normalizedRole === 'stakeholder' ? 'provider' : normalizedRole;

  return {
    isValid: true,
    role: mappedRole
  };
};

/**
 * Username validation
 */
export const validateUserName = (userName) => {
  if (!userName || userName.trim().length === 0) {
    return {
      isValid: true, // Username is optional
      userName: null
    };
  }

  if (userName.length < 2) {
    return {
      isValid: false,
      error: 'Username must be at least 2 characters long'
    };
  }

  if (userName.length > 50) {
    return {
      isValid: false,
      error: 'Username must be less than 50 characters'
    };
  }

  // Allow alphanumeric, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(userName)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores'
    };
  }

  return {
    isValid: true,
    userName: userName.trim()
  };
};

