import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, ImageBackground, Keyboard } from 'react-native';
import { useDispatch, connect } from 'react-redux';

import ContainerView from '../../UI/views/ContainerView';
import LogoView from '../../UI/views/LogoView';
import AuthInputView from '../../UI/views/AuthInputView';
import AuthButtonView from '../../UI/views/AuthButtonView';
import FooterView from '../../UI/views/footer/FooterView';
import DualTextButtonView from '../../UI/views/footer/DualTextButtonView';
import SelectionModal from '../../UI/modals/SelectionModal';

import { login, resetMessages } from '../../actions/auth';
import { resetUser } from '../../actions/user';

import styles from '../styles';

const backgroundImage = require('../../../assets/images/background.png');

const Login = ({ route, navigation, error, success, fetching }) => {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailActive, setEmailActive] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', body: '' });

  const inputBlockOptions = [
    {
      type: 'EMAIL',
      keyboardType: 'email-address',
      placeholder: 'Email',
      value: email,
      onChangeText: (text) => handleInputChange(text, 'EMAIL'),
      onPress: (type) => handleInputPress(type),
      removeKeyboard: () => handleRemoveKeyboard(),
      active: emailActive,
    },
    {
      type: 'PASSWORD',
      placeholder: 'Password',
      isPassword: true,
      value: password,
      onChangeText: (text) => handleInputChange(text, 'PASSWORD'),
      onPress: (type) => handleInputPress(type),
      removeKeyboard: () => handleRemoveKeyboard(),
      active: passwordActive,
    },
  ];

  const modalOptions = {
    title: modalMessage.title,
    body: modalMessage.body,
    buttonStyle: 'horizontal',
    buttons:
      success && success.accountDeleteSuccess
        ? [
            {
              title: 'OK',
              onPress: () => {
                setShowModal(false);
                dispatch(resetMessages());
              },
            },
          ]
        : [
            {
              title: 'Try Again',
              onPress: () => {
                setShowModal(false);
                dispatch(resetMessages());
              },
            },
            {
              title: 'Need Help?',
              onPress: () => {
                dispatch(resetMessages());
                setShowModal(false);
                navigation.navigate('Help');
              },
            },
          ],
  };

  const handleRemoveKeyboard = () => {
    Keyboard.dismiss();
    setEmailActive(false);
    setPasswordActive(false);
  };

  const handleInputPress = (type) => {
    switch (type) {
      case 'EMAIL':
        setEmailActive(true);
        setPasswordActive(false);
        break;
      case 'PASSWORD':
        setPasswordActive(true);
        setEmailActive(false);
        break;
      default:
        break;
    }
  };

  const handleInputChange = (text, type) => {
    switch (type) {
      case 'EMAIL':
        setEmail(text);
        break;
      case 'PASSWORD':
        setPassword(text);
        break;
      default:
        break;
    }
  };

  const handleSignUp = () => {
    dispatch(resetMessages());
    navigation.navigate('Signup (Step 1)');
  };

  const handleOnHelpPress = () => {
    dispatch(resetMessages());
    navigation.navigate('Help');
  };

  const handleStartPress = () => {
    if (email.length === 0) {
      setShowModal(true);
      setModalMessage({
        title: 'Authentication Error',
        body: 'Make sure to provide a valid Email',
      });
    } else if (password.length === 0) {
      setShowModal(true);
      setModalMessage({
        title: 'Authentication Error',
        body: 'The provided password is too short',
      });
    } else {
      handleRemoveKeyboard();
      dispatch(login(email, password));
      dispatch(resetMessages());
    }
  };

  useEffect(() => {
    if (error && error.loginError) {
      setShowModal(true);
      setModalMessage({
        title: 'Authentication Error',
        body: error.loginError,
      });
    } else if (success && success.accountDeleteSuccess) {
      setModalMessage({
        title: 'Account deleted',
        body: success.accountDeleteSuccess,
      });
      setShowModal(true);
    }
  }, [error, success]);

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <ContainerView
        onPress={handleRemoveKeyboard}
        backgroundColor="transparent"
        loadingOptions={{ loading: fetching }}
        headerHeight={route.params.headerHeight}
      >
        <SelectionModal
          showModal={showModal}
          options={modalOptions}
          timeout={500}
          onModalDismissPress={() => setShowModal(false)}
        />
        <View style={styles.topView}>
          <LogoView title="SIGN IN" />
        </View>
        <View style={styles.inputView}>
          <AuthInputView inputOptions={inputBlockOptions} />
        </View>
        <View
          style={[
            styles.buttonView,
            (emailActive || passwordActive) && styles.$active,
          ]}
        >
          <AuthButtonView
            onStartPress={handleStartPress}
            mainButtonText="NEXT"
          />
        </View>
        {!emailActive && !passwordActive && (
          <FooterView backgroundColor="transparent">
            <DualTextButtonView
              leftButtonTitle="Create Account"
              rightButtonTitle="Need Help?"
              leftButtonPress={handleSignUp}
              rightButtonPress={handleOnHelpPress}
            />
          </FooterView>
        )}
      </ContainerView>
    </ImageBackground>
  );
};

Login.defaultProps = {
  error: null,
  success: null,
};

Login.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.instanceOf(Object),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  fetching: PropTypes.bool.isRequired,
  error: PropTypes.objectOf(PropTypes.string),
  success: PropTypes.objectOf(PropTypes.string),
};

const mapStateToProps = (state) => {
  const { fetching, error, success } = state.auth;

  return {
    fetching,
    error,
    success,
  };
};

export default connect(mapStateToProps)(Login);
