// Firebase Auth SDK
const authInstances = {};

// Token mock para testes
const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiYjI2MzY3YWJhYmM0MzExMTdkYjA2ZGFlNjFiZGJkMjVmMjE0ZGQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGVzdCBVc2VyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGNqVVNlclRlc3QiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWluZGZ1bGwtOTkzZDgiLCJhdWQiOiJtaW5kZnVsbC05OTNkOCIsImF1dGhfdGltZSI6MTcxMTI0ODQwMCwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTU5MjQyMzE5OTk5OTk5OTk5OTkiXSwiZW1haWwiOlsidXNlckBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifSwiaWF0IjoxNzExMjQ4NDAwLCJleHAiOjE3MTEyNTIwMDAsInN1YiI6InRlc3QtdXNlci1pZCJ9.test-signature';

export function getAuth(app) {
  const name = app?.name || '[DEFAULT]';
  if (authInstances[name]) {
    return authInstances[name];
  }

  const auth = {
    app,
    currentUser: null,
    listeners: [],
    async signInWithPopup(provider) {
      try {
        // Simula o processo de login com um token JWT válido
        const user = {
          uid: 'test-user-id',
          email: 'user@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          getIdToken: () => Promise.resolve(mockToken)
        };
        
        auth.currentUser = user;
        auth.listeners.forEach(listener => listener(user));
        return { user };
      } catch (error) {
        console.error('Error in signInWithPopup:', error);
        throw error;
      }
    },
    onAuthStateChanged(callback) {
      auth.listeners.push(callback);
      return () => {
        auth.listeners = auth.listeners.filter(listener => listener !== callback);
      };
    }
  };

  authInstances[name] = auth;
  return auth;
}

export class GoogleAuthProvider {
  constructor() {
    this.providerId = 'google.com';
  }
}

export function signInWithPopup(auth, provider) {
  return auth.signInWithPopup(provider);
}
