import React, { Component } from 'react';

class Login extends Component {
  constructor() {
    super();

    this.state = {
      username: '',
      password: '',
      fail: false
    };
  }

  isLoggedIn() {
    if (localStorage.getItem('token')) {
      return true;
    }

    return false;
  }
  
  login(username, password) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json' 
    };

    if (this.isLoggedIn()) {
      headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    }

    return fetch('/api/login', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        username: username, 
        password: password 
      })
    });
  }

  handleUsernameChange = (event) => {
    this.setState({ username: event.target.value });
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    this.login(this.state.username, this.state.password)
      .then(res => {
        if (res.status !== 200) {
          this.setState({ fail: true });

          return;
        }

        return Promise.resolve(res.json())
          .then(res => {
            if (res.token) {
              localStorage.setItem('token', res.token);
              localStorage.setItem('roleID', res.roleID);
            }

            window.location.reload();
          });
      });
  };

  render() {
    return (
      <div>
        <p style={{ 'color': 'red', 'display': this.state.fail ? 'block' : 'none' }}>Invalid password and username.</p>
        <form onSubmit={this.handleSubmit} style={{ width: '100%' }}>
          <label>
            Username:
            <input type='text' value={this.state.username} onChange={this.handleUsernameChange} name='username' autoComplete='foo' />
          </label><br />
          <label>
            Password:
            <input type='password' value={this.state.password} onChange={this.handlePasswordChange} name='password' autoComplete='foo' />
          </label><br />
          <input type='submit' value='Submit' />
        </form>
      </div>
    );
  }
}

export default Login;
