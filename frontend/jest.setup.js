import '@testing-library/jest-dom';

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:preview';
}

if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}
