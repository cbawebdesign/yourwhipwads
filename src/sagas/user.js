import { put, call, select } from 'redux-saga/effects';

import {
  USER_INFO_RESULT,
  USER_INFO_ERROR,
  UPDATE_INTERESTS_RESULT,
  UPDATE_SETTINGS_RESULT,
  UPDATE_SETTINGS_ERROR,
  UPDATE_INTERESTS_ERROR,
  RECOMMENDED_USERS_RESULT,
  RECOMMENDED_USERS_ERROR,
  REMOVE_USER_PRESS_RESULT,
  REMOVE_USER_PRESS_ERROR,
  EDIT_PROFILE_RESULT,
  EDIT_PROFILE_ERROR,
  SEARCH_RESULT,
  SEARCH_ERROR,
} from '../actions/user';

import { API_HOST } from '../config/constants';

const fetchUserInfo = (action) =>
  fetch(`${API_HOST}/get-user-info/`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${action.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

const fetchUpdateInterests = ({ action, token }) =>
  fetch(`${API_HOST}/update-interests/`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      interests: action.interests,
    }),
  });

const fetchUpdateSettings = ({ token, action }) =>
  fetch(`${API_HOST}/update-settings/`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings: action.settings,
    }),
  });

const fetchRecommendedUsers = (token) =>
  fetch(`${API_HOST}/get-recommended-users/`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

const fetchRemoveUserPress = ({ action, token }) =>
  fetch(`${API_HOST}/remove-user-press/`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: action.user,
    }),
  });

const fetchEditProfile = ({ token, formData }) =>
  fetch(`${API_HOST}/edit-profile/`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

const fetchSearch = ({ action, token }) =>
  fetch(`${API_HOST}/search-users/${action.input}`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

export function* getUserInfo(action) {
  try {
    const response = yield call(fetchUserInfo, action);
    const result = yield response.json();

    if (result.error) {
      yield put({ type: USER_INFO_ERROR, error: result.error });
    } else {
      yield put({ type: USER_INFO_RESULT, result });
    }
  } catch (e) {
    yield put({ type: USER_INFO_ERROR, error: e.message });
  }
}

export function* updateInterests(action) {
  const token = yield select((state) => state.auth.authToken);

  try {
    const response = yield call(fetchUpdateInterests, { action, token });
    const result = yield response.json();

    // NO NEED TO STORE INTEREST IN APP STATE FOR THE MOMENT
    if (result.error) {
      yield put({ type: UPDATE_INTERESTS_ERROR, error: result.error });
    } else {
      yield put({ type: UPDATE_INTERESTS_RESULT, result });
    }
  } catch (e) {
    yield put({ type: UPDATE_INTERESTS_ERROR, error: e.message });
  }
}

export function* updateSettings(action) {
  const token = yield select((state) => state.auth.authToken);

  try {
    const response = yield call(fetchUpdateSettings, { action, token });
    const result = yield response.json();

    // NO NEED TO STORE INTEREST IN APP STATE FOR THE MOMENT
    if (result.error) {
      yield put({ type: UPDATE_SETTINGS_ERROR, error: result.error });
    } else {
      yield put({ type: UPDATE_SETTINGS_RESULT, result });
    }
  } catch (e) {
    yield put({ type: UPDATE_SETTINGS_ERROR, error: e.message });
  }
}

export function* getRecommendedUsers() {
  const token = yield select((state) => state.auth.authToken);

  try {
    const response = yield call(fetchRecommendedUsers, token);
    const result = yield response.json();

    if (result.error) {
      yield put({ type: RECOMMENDED_USERS_ERROR, error: result.error });
    } else {
      yield put({ type: RECOMMENDED_USERS_RESULT, result });
    }
  } catch (e) {
    yield put({ type: RECOMMENDED_USERS_ERROR, error: e.message });
  }
}

export function* removeUserPress(action) {
  const token = yield select((state) => state.auth.authToken);

  try {
    const response = yield call(fetchRemoveUserPress, { action, token });
    const result = yield response.json();

    if (result.error) {
      yield put({ type: REMOVE_USER_PRESS_ERROR, error: result.error });
    } else {
      yield put({ type: REMOVE_USER_PRESS_RESULT, result });
    }
  } catch (e) {
    yield put({ type: REMOVE_USER_PRESS_ERROR, error: e.message });
  }
}

export function* editProfile(action) {
  const token = yield select((state) => state.auth.authToken);
  const user = yield select((state) => state.user.user);

  const formData = new FormData();
  formData.append(
    'birthday',
    action.userInfo.birthday
      ? action.userInfo.birthday.toString()
      : user.birthday
  );
  formData.append('gender', action.userInfo.gender || user.gender);
  formData.append('location', action.userInfo.location || '');
  formData.append(
    'description',
    action.userInfo.description || user.description
  );

  if (
    action.userInfo.profileImage &&
    action.userInfo.profileImage.uri &&
    action.userInfo.profileImage.uri.length > 0
  ) {
    formData.append('profileImage', {
      uri: action.userInfo.profileImage.uri,
      type: 'image/jpg',
      name: 'profileImage',
    });
  }
  try {
    const response = yield call(fetchEditProfile, { token, formData });
    const result = yield response.json();

    if (result.error) {
      yield put({ type: EDIT_PROFILE_ERROR, error: result.error });
    } else {
      yield put({ type: EDIT_PROFILE_RESULT, result });
    }
  } catch (e) {
    yield put({ type: EDIT_PROFILE_ERROR, error: e.message });
  }
}

export function* search(action) {
  const token = yield select((state) => state.auth.authToken);

  try {
    const response = yield call(fetchSearch, { action, token });
    const result = yield response.json();

    if (result.error) {
      yield put({ type: SEARCH_ERROR, error: result.error });
    } else {
      yield put({ type: SEARCH_RESULT, result });
    }
  } catch (e) {
    yield put({ type: SEARCH_ERROR, error: e.message });
  }
}
