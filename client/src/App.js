import React, { useState, useEffect } from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";

import Layout from "./components/Layout/Layout";
import Backdrop from "./components/Backdrop/Backdrop";
import Toolbar from "./components/Toolbar/Toolbar";
import MainNavigation from "./components/Navigation/MainNavigation/MainNavigation";
import MobileNavigation from "./components/Navigation/MobileNavigation/MobileNavigation";
import ErrorHandler from "./components/ErrorHandler/ErrorHandler";
import FeedPage from "./pages/Feed/Feed";
import SinglePostPage from "./pages/Feed/SinglePost/SinglePost";
import LoginPage from "./pages/Auth/Login";
import SignupPage from "./pages/Auth/Signup";
import "./App.css";

const App = () => {
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiryDate = localStorage.getItem("expiryDate");
    if (!token || !expiryDate) {
      return;
    }
    if (new Date(expiryDate) <= new Date()) {
      logoutHandler();
      return;
    }
    const userId = localStorage.getItem("userId");
    const remainingMilliseconds =
      new Date(expiryDate).getTime() - new Date().getTime();
    console.log("useEffect token", token);
    setIsAuth(true);
    setToken(token);
    setUserId(userId);
    setAutoLogout(remainingMilliseconds);
  }, []);

  const mobileNavHandler = (isOpen) => {
    setShowMobileNav(isOpen);
    setShowBackdrop(isOpen);
  };

  const backdropClickHandler = () => {
    setShowBackdrop(false);
    setShowMobileNav(false);
    setError(null);
  };

  const logoutHandler = () => {
    setIsAuth(false);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("expiryDate");
    localStorage.removeItem("userId");
  };

  const loginHandler = async (event, authData) => {
    alert("aici");
    event.preventDefault();
    setAuthLoading(true);
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
        }),
      });
      if (response.status === 422) {
        throw new Error("Validation failed.");
      }
      if (response.status !== 200 && response.status !== 201) {
        console.log("Error!");
        throw new Error("Could not authenticate you!");
      }

      const resData = await response.json();

      console.log("login handler resData", resData);
      setToken(resData.token);
      setIsAuth(true);
      setAuthLoading(false);
      setUserId(resData.userId);
      localStorage.setItem("token", resData.token);
      localStorage.setItem("userId", resData.userId);
      const remainingMilliseconds = 60 * 60 * 1000;
      const expiryDate = new Date(new Date().getTime() + remainingMilliseconds);
      localStorage.setItem("expiryDate", expiryDate.toISOString());
      setAutoLogout(remainingMilliseconds);
    } catch (err) {
      console.log(err);
      setIsAuth(false);
      setAuthLoading(false);
      setError(err);
    }
  };

  const signupHandler = async (event, authData) => {
    event.preventDefault();
    setAuthLoading(true);
    try {
      const response = await fetch("http://localhost:8080/auth/signup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authData.signupForm.email.value,
          password: authData.signupForm.password.value,
          name: authData.signupForm.name.value,
        }),
      });
      if (response.status === 422) {
        throw new Error(
          "Validation failed. Make sure the email address isn't used yet!"
        );
      }
      if (response.status !== 200 && response.status !== 201) {
        console.log("Error!");
        throw new Error("Creating a user failed!");
      }
      const resData = await response.json();
      console.log(resData);
      setIsAuth(false);
      setAuthLoading(false);
      // this.props.history.replace("/");
    } catch (err) {
      console.log(err);
      setIsAuth(false);
      setAuthLoading(false);
      setError(err);
    }
  };

  const setAutoLogout = (milliseconds) => {
    setTimeout(() => {
      logoutHandler();
    }, milliseconds);
  };

  const errorHandler = () => {
    setError(null);
  };

  let routes = (
    <Switch>
      <Route
        path="/"
        exact
        render={(props) => (
          <LoginPage {...props} onLogin={loginHandler} loading={authLoading} />
        )}
      />
      <Route
        path="/signup"
        exact
        render={(props) => (
          <SignupPage
            {...props}
            onSignup={signupHandler}
            loading={authLoading}
          />
        )}
      />
      <Redirect to="/" />
    </Switch>
  );

  if (isAuth) {
    console.log("userId", userId);
    console.log("asasasasastoken", token);
    routes = (
      <Switch>
        <Route
          path="/"
          exact
          render={(props) => <FeedPage userId={userId} token={token} />}
        />
        <Route
          path="/:postId"
          render={(props) => (
            <SinglePostPage {...props} userId={userId} token={token} />
          )}
        />
        <Redirect to="/" />
      </Switch>
    );
  }

  return (
    <>
      {showBackdrop && <Backdrop onClick={backdropClickHandler} />}
      <ErrorHandler error={error} onHandle={errorHandler} />
      <Layout
        header={
          <Toolbar>
            <MainNavigation
              onOpenMobileNav={() => mobileNavHandler(true)}
              onLogout={logoutHandler}
              isAuth={isAuth}
            />
          </Toolbar>
        }
        mobileNav={
          <MobileNavigation
            open={showMobileNav}
            mobile
            onChooseItem={() => mobileNavHandler(false)}
            onLogout={logoutHandler}
            isAuth={isAuth}
          />
        }
      />
      {routes}
    </>
  );
};
export default withRouter(App);
