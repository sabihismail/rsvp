import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Login from './admin/Login';
import AdminPanel from './admin/AdminPanel';
import AdminRegisterPanel from './admin/AdminRegisterPanel';
import Wedding from './themes/Wedding';

import './index.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Router>
    <div id='router'>
      <Route exact path='/admin/login' component={localStorage.getItem('token') ? AdminPanel : Login} />
      <Route exact path='/admin/register/:token' component={(props) => 
        <AdminRegisterPanel token={props.match.params.token} />
      } />
      <Route exact path='/' component={() =>
        <Wedding bride={process.env.BRIDE} groom={process.env.GROOM} event={process.env.EVENT} />
      } />
      <Route exact path='/:id' component={(props) => 
        <Wedding bride={process.env.BRIDE} groom={process.env.GROOM} event={process.env.EVENT} id={props.match.params.id} />
      } />
    </div>
  </Router>,
  document.getElementById('root')
);

registerServiceWorker();
