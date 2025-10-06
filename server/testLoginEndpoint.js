const axios = require('axios');

async function testLoginEndpoint() {
  console.log('🔐 Testing Login Endpoint...\n');
  
  try {
    const baseURL = 'http://localhost:5001';
    
    // Test 1: Check if server is responding
    console.log('Step 1: Testing server connectivity...');
    try {
      const response = await axios.get(`${baseURL}/`);
      console.log('✅ Server is responding:', response.data);
    } catch (err) {
      console.log('❌ Server not responding:', err.message);
      return;
    }
    
    // Test 2: Test login with the user we just reset
    console.log('\nStep 2: Testing login endpoint...');
    const loginData = {
      email: 'sanjayk919@gmail.com',
      password: 'password123'
    };
    
    console.log('Login attempt with:', loginData);
    
    try {
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login successful!');
      console.log('Response:', {
        message: loginResponse.data.message,
        hasToken: !!loginResponse.data.token,
        user: loginResponse.data.user
      });
      
    } catch (err) {
      console.log('❌ Login failed!');
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Error message:', err.response.data.message);
      } else {
        console.log('Network error:', err.message);
      }
    }
    
    // Test 3: Test registration endpoint
    console.log('\nStep 3: Testing registration endpoint...');
    const registerData = {
      name: 'Test User Login',
      email: 'testlogin@example.com',
      password: 'testpass123',
      role: 'user'
    };
    
    console.log('Registration attempt with:', registerData);
    
    try {
      const registerResponse = await axios.post(`${baseURL}/api/auth/register`, registerData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Registration successful!');
      console.log('Response:', {
        message: registerResponse.data.message,
        hasToken: !!registerResponse.data.token,
        user: registerResponse.data.user
      });
      
      // Test 4: Immediately try to login with the new account
      console.log('\nStep 4: Testing immediate login after registration...');
      const immediateLoginData = {
        email: 'testlogin@example.com',
        password: 'testpass123'
      };
      
      try {
        const immediateLoginResponse = await axios.post(`${baseURL}/api/auth/login`, immediateLoginData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Immediate login successful!');
        console.log('Response:', {
          message: immediateLoginResponse.data.message,
          hasToken: !!immediateLoginResponse.data.token,
          user: immediateLoginResponse.data.user
        });
        
      } catch (immediateErr) {
        console.log('❌ Immediate login failed!');
        if (immediateErr.response) {
          console.log('Status:', immediateErr.response.status);
          console.log('Error message:', immediateErr.response.data.message);
        } else {
          console.log('Network error:', immediateErr.message);
        }
      }
      
    } catch (err) {
      console.log('❌ Registration failed!');
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Error message:', err.response.data.message);
      } else {
        console.log('Network error:', err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error during endpoint test:', err.message);
  }
}

testLoginEndpoint();
