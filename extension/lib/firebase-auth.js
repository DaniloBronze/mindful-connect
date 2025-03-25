// Firebase Auth SDK - Using npm modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to sign in with Google
export async function signInWithGoogle() {
  try {
    // First, remove any cached tokens
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken) {
      try {
        await chrome.identity.removeCachedAuthToken({ token: authToken });
      } catch (e) {
        console.log('Error removing cached token:', e);
      }
    }

    // Request new token with interactive sign in
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: true
      }, (newToken) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome Identity Error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(newToken);
        }
      });
    });

    // Get user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
    }

    const userInfo = await response.json();
    console.log('User info received:', userInfo);

    // Store user info
    await chrome.storage.local.set({
      authToken: token,
      userEmail: userInfo.email,
      userName: userInfo.name,
      userPhoto: userInfo.picture
    });

    return {
      email: userInfo.email,
      displayName: userInfo.name,
      photoURL: userInfo.picture
    };
  } catch (error) {
    console.error('Error signing in:', error);
    // Clear any stored data on error
    await chrome.storage.local.remove(['authToken', 'userEmail', 'userName', 'userPhoto']);
    throw error;
  }
}

// Function to check if user is logged in
export async function getCurrentUser() {
  try {
    const data = await chrome.storage.local.get(['authToken', 'userEmail', 'userName', 'userPhoto']);
    if (data.authToken && data.userEmail) {
      // Verify the token is still valid
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${data.authToken}`
          }
        });
        
        if (!response.ok) {
          console.log('Token invalid, clearing data');
          await chrome.storage.local.remove(['authToken', 'userEmail', 'userName', 'userPhoto']);
          return null;
        }
      } catch (e) {
        console.error('Error verifying token:', e);
        return null;
      }

      return {
        email: data.userEmail,
        displayName: data.userName,
        photoURL: data.userPhoto
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Function to sign out
export async function signOut() {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken) {
      try {
        // Remove the token from Chrome's cache
        await chrome.identity.removeCachedAuthToken({ token: authToken });
        
        // Revoke access
        const response = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`);
        if (!response.ok) {
          console.error('Error revoking token:', response.statusText);
        }
      } catch (e) {
        console.error('Error removing token:', e);
      }
    }
    
    // Clear stored data
    await chrome.storage.local.remove(['authToken', 'userEmail', 'userName', 'userPhoto']);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
