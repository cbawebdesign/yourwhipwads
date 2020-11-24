export const GET_COMMENT_FEED = 'GET_COMMENT_FEED';
export const COMMENT_FEED_RESULT = 'COMMENT_FEED_RESULT';
export const COMMENT_FEED_ERROR = 'COMMENT_FEED_ERROR';

export const LIKE_COMMENT_PRESS = 'LIKE_COMMENT_PRESS';
export const LIKE_COMMENT_PRESS_RESULT = 'LIKE_COMMENT_PRESS_RESULT';
export const LIKE_COMMENT_PRESS_ERROR = 'LIKE_COMMENT_PRESS_ERROR';

export const COMPOSE_NEW_COMMENT = 'COMPOSE_NEW_COMMENT';
export const NEW_COMMENT_RESULT = 'COMMENTS_RESULT';
export const NEW_COMMENT_ERROR = 'COMMENTS_ERROR';

export const DELETE_COMMENT = 'DELETE_COMMENT';
export const DELETE_COMMENT_RESULT = 'DELETE_COMMENT_RESULT';
export const DELETE_COMMENT_ERROR = 'DELETE_COMMENT_ERROR';

export const RESET_COMMENT_UPDATE_CHECK = 'RESET_COMMENT_UPDATE_CHECK';

export const getCommentFeed = (data) => ({
  type: GET_COMMENT_FEED,
  data,
});

export const composeNewComment = (data) => ({
  type: COMPOSE_NEW_COMMENT,
  data,
});

export const deleteComment = (data) => ({
  type: DELETE_COMMENT,
  data,
});

export const likeCommentPress = (data) => ({
  type: LIKE_COMMENT_PRESS,
  data,
});

export const resetCommentUpdateCheck = () => ({
  type: RESET_COMMENT_UPDATE_CHECK,
});
