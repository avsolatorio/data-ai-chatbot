// Quick script to check auth status
// Run in browser console

async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.log('❌ Not authenticated (status:', response.status, ')');
      console.log('Error:', error);
      return;
    }

    const user = await response.json();

    if (user.type === 'regular') {
      console.log('✅ Logged in as:', user.email);
      console.log('User ID:', user.id);
    } else if (user.type === 'guest') {
      console.log('👤 Guest user');
      console.log('Guest ID:', user.id);
    } else {
      console.log('❓ Unknown user type:', user);
    }

    // Check cookies
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {});

    console.log('\n📋 Cookies:');
    if (cookies.auth_token) console.log('  - auth_token: ✅ Present');
    if (cookies.user_session_id) console.log('  - user_session_id: ✅ Present (Regular user)');
    if (cookies.guest_session_id) console.log('  - guest_session_id: ✅ Present (Guest user)');

    return user;
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Run it
checkAuth();
