import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { useDispatch, connect } from 'react-redux';
import { useSafeArea } from 'react-native-safe-area-context';
import { debounce } from 'throttle-debounce';
import { AnimatedFlatList, AnimationType } from 'flatlist-intro-animations';

import ContainerView from '../../UI/views/ContainerView';
import PhotoModal from '../../UI/modals/PhotoModal';
import ExploreListItem from '../../UI/lists/ExploreListItem';
import ShareModal from '../../UI/modals/ShareModal';
import SelectionModal from '../../UI/modals/SelectionModal';
import EmptyListText from '../../UI/text/EmptyListText';
import { CustomText as Text, BODY_FONT } from '../../UI/text/CustomText';

import {
  onLikePressHelper,
  onLikeSharedImageHelper,
  onNewCommentHelper,
  onSharedImageNewCommentHelper,
  onShareHelper,
  onSocialMediaShare,
  onSharedImageShareHelper,
  onDeleteHelper,
} from '../../helpers/socialHelpers';
import { isCloseToBottom } from '../../helpers/scrollHelpers';

import { getHomeFeed, deletePost, resetDeletePost } from '../../actions/home';
import { likePostPress, resetNewLikeCheck } from '../../actions/likes';
import { sharePost, shareImage } from '../../actions/shares';
import { likeImagePress } from '../../actions/detail';
import { resetCommentUpdateCheck } from '../../actions/comments';

import {
  exploreItemPropType,
  userPropType,
  commentPropType,
} from '../../config/propTypes';
import { PAGINATION_LIMIT } from '../../config/constants';

import styles from '../styles';

// DISPLAYS THE EXPLORE SCREEN
// Applies the following props:
// route (contains params with all the 'compose' information
// created in the Compose screen)
// navigation (to navigate to the Profile screen on pressing
// the profile image)
// currentUser (contains all data of loged-in user)
// homeFeed (list of feed items ('posts'))
// commentsUpdateCheck (contains post ID if a comment was added
// inside the Comment screen, else 'null')

const Explore = ({
  route,
  navigation,
  homeFeed,
  endOfList,
  currentUser,
  commentsUpdateCheck,
  newLikeCheck,
  deletedPost,
  fetching,
}) => {
  const dispatch = useDispatch();
  const paddingBottom = useSafeArea().bottom;

  const [feed, setFeed] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageShown, setImageShown] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  const [viewableItems, setViewableItems] = useState([]);

  const postOptions = {
    title: 'Delete post',
    body: 'Are you sure you want to delete this post?',
    buttonStyle: 'horizontal',
    buttons: [
      {
        title: 'Cancel',
        onPress: () => setShowPostOptions(false),
      },
      {
        title: 'Delete',
        onPress: () => {
          const updatedFeed = onDeleteHelper(feed, currentItem);

          setFeed(updatedFeed);
          setShowPostOptions(false);
        },
      },
    ],
  };

  const handlePress = (item) => {
    navigation.navigate('ExploreDetail', {
      ...route.params,
      parentId: item._id,
    });
  };

  const handleProfilePress = (type, item) => {
    let user;

    if (type === 'SHARED_ITEM_USER' && item.sharedImage) {
      user = item.sharedImage.createdBy;
    } else if (type === 'SHARED_ITEM_USER' && item.sharedPost) {
      user = item.sharedPost.createdBy;
    } else {
      user = item.createdBy;
    }

    navigation.navigate('Profile', {
      ...route.params,
      user,
    });
  };

  const handleLikePress = (item, type) => {
    if (type === 'IMAGE') {
      // UPDATE IMAGE LOCAL STATE
      const updatedImage = onLikePressHelper(currentUser._id, item);
      setImageShown(updatedImage);

      // UPDATE FEED LOCAL STATE
      const updatedFeed = onLikeSharedImageHelper(feed, updatedImage[0]);
      setFeed(updatedFeed);

      // DISPATCH TO SERVER
      dispatch(likeImagePress(item._id));
    } else {
      // UPDATE FEED LOCAL STATE
      const updatedFeed = onLikePressHelper(currentUser._id, feed, item);
      setFeed(updatedFeed);

      // DISPATCH TO SERVER
      dispatch(likePostPress({ fromScreen: 'EXPLORE', parentId: item._id }));
    }
  };

  const handleCommentsPress = (item, type = 'POST') => {
    if (type === 'SHARED_IMAGE') {
      setShowImage(false);
    }

    navigation.navigate('Comments', {
      type,
      fromScreen: 'EXPLORE',
      post: item,
    });
  };

  const handleSharePress = async (item) => {
    setShowShareModal(true);
    setCurrentItem(item);
  };

  const handleShareAction = async (type = 'POST') => {
    if (type === 'IMAGE') {
      dispatch(
        shareImage({
          sharedImageId: imageShown[0]._id,
          activityType: 'IN_APP_SHARE',
          description: shareMessage,
        })
      );

      const result = onSharedImageShareHelper(
        currentUser._id,
        feed,
        imageShown[0]
      );
      setFeed(result);
    } else {
      // DISPATCH TO SERVER
      dispatch(
        sharePost({
          parentId: currentItem._id,
          sharedPostId: currentItem._id,
          activityType: 'IN_APP_SHARE',
          description: shareMessage,
        })
      );

      // UPDATE FEED LOCAL STATE
      const result = await onShareHelper(currentUser._id, feed, currentItem);
      setFeed(result);
    }

    setShareMessage('');
    setShowShareModal(false);
  };

  const handleShareOptionsPress = async () => {
    // PROCESS SHARE WITH SOCIAL MEDIA
    // AND UPDATE FEED LOCAL STATE
    const result = await onSocialMediaShare(currentUser._id, feed, currentItem);

    if (result === 'dismissedAction') {
      setShowShareModal(false);

      return;
    }

    if (result.share.activityType) {
      dispatch(
        sharePost({
          parentId: currentItem._id,
          activityType: result.share.activityType,
        })
      );

      setFeed(result.feed);
    } else if (result.share.action === 'sharedAction') {
      dispatch(sharePost({ parentId: currentItem._id }));

      setFeed(result.feed);
    }

    setShowShareModal(false);
  };

  const handlePostOptionsPress = (item) => {
    setCurrentItem(item);
    setShowPostOptions(true);
  };

  const handleDeletePost = (fromScreen) => {
    const deletedPostId = deletedPost ? deletedPost.postId : currentItem._id;

    // DISPATCH 'DELETEPOST' ONLY FOR THIS SCREEN
    // DETAIL SCREEN HANDLES ITS OWN DISPATCH 'DELETEPOST'
    if (fromScreen !== 'EXPLORE_DETAIL') {
      dispatch(deletePost({ postId: deletedPostId, fromScreen }));
    }

    // REMOVE POST FROM LOCAL FEED STATE
    const feedCopy = [...feed];
    const updatedFeed = feedCopy.filter((item) => item._id !== deletedPostId);
    setFeed(updatedFeed);

    setShowPostOptions(false);
  };

  const updateLikeButtonView = () => {
    const updatedFeed = onLikePressHelper(
      currentUser._id,
      feed,
      null,
      newLikeCheck
    );
    setFeed(updatedFeed);

    dispatch(resetNewLikeCheck());
  };

  const updateCommentButtonView = () => {
    // IN CASE OF SHARED iMAGE, UPDATE THE 'SHAREDIMAGE'
    // KEY ON THE FEED ITEM
    if (commentsUpdateCheck.type === 'SHARED_IMAGE') {
      const updatedFeed = onSharedImageNewCommentHelper(
        feed,
        imageShown[0],
        commentsUpdateCheck.comments
      );
      setFeed(updatedFeed);
    } else {
      // ADD NEW COMMENT ON RETURN FROM 'COMMENT'
      const updatedFeed = onNewCommentHelper(
        currentUser._id,
        feed,
        commentsUpdateCheck
      );

      setFeed(updatedFeed);
    }

    dispatch(resetCommentUpdateCheck());
  };

  const onViewRef = useRef((itemsInView) => {
    if (itemsInView.viewableItems !== viewableItems) {
      setViewableItems(itemsInView.viewableItems);
    }
  }).current;
  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 })
    .current;

  const handleRefresh = () => {
    dispatch(getHomeFeed(0, PAGINATION_LIMIT));
  };

  const handleLoadMore = (count) => {
    dispatch(getHomeFeed(count, PAGINATION_LIMIT));
  };
  const handleLoadMoreThrottled = useRef(debounce(500, handleLoadMore)).current;

  const renderItem = ({ item }) => (
    <ExploreListItem
      item={item}
      currentUser={currentUser}
      onPress={() => {
        if (item.sharedImage) {
          // SHOW IMAGE MODAL FOR SHARED IMAGES
          setCurrentItem(item.sharedImage);
          setShowImage(true);
          setImageShown([item.sharedImage]);
        } else {
          handlePress(item.sharedPost || item);
        }
      }}
      onCommentsPress={() => handleCommentsPress(item)}
      onLikePress={() => handleLikePress(item)}
      onSharePress={() => handleSharePress(item)}
      onProfilePress={(type) => handleProfilePress(type, item)}
      enableOptions={item.createdBy._id === currentUser._id}
      onOptionsPress={() => handlePostOptionsPress(item)}
      onDeletePress={() => handleDeletePost('EXPLORE')}
      itemInView={viewableItems.some(
        (viewable) => viewable.item._id === item._id
      )}
    />
  );

  const renderEmptyListText = () => (
    <EmptyListText text="Start following people to see their posts, or disable the 'show posts based on my interest' Setting." />
  );

  const renderListFooterComponent = () => (
    <Text
      text={endOfList && feed.length > 0 ? "That's all folks!" : ''}
      fontFamily={BODY_FONT}
      style={styles.endOfList}
    />
  );

  useEffect(() => {
    // REFETCH ALFTER USER EDITS PROFILE IMAGE
    dispatch(getHomeFeed(0, PAGINATION_LIMIT));
  }, [currentUser]);

  useEffect(() => {
    // HANDLE POST DELETE ACTION IN EXPLORE DETAIL SCREEN
    if (
      deletedPost &&
      (deletedPost.fromScreen === 'EXPLORE_DETAIL' ||
        deletedPost.fromScreen === 'PROFILE')
    ) {
      handleDeletePost('EXPLORE_DETAIL');
    }

    // RESET GLOBAL STATE 'DELETEDPOST' IN CASE OF NEW POST DELETE ACTION
    dispatch(resetDeletePost());
  }, [deletedPost]);

  useEffect(() => {
    if (deletedPost) {
      return;
    }
    setFeed(homeFeed);

    // DO UPDATE CHECK AFTER RETURNING FROM COMMENT SCREEN
    if (
      commentsUpdateCheck !== null &&
      (commentsUpdateCheck.fromScreen === 'EXPLORE' ||
        commentsUpdateCheck.fromScreen === 'EXPLORE_DETAIL' ||
        commentsUpdateCheck.fromScreen === 'PROFILE')
    ) {
      updateCommentButtonView();
    }

    // DO UPDATE CHECK AFTER RETURNING FROM EXPLORE DETAIL SCREEN
    if (
      newLikeCheck !== null &&
      (newLikeCheck.fromScreen === 'EXPLORE_DETAIL' ||
        newLikeCheck.fromScreen === 'PROFILE')
    ) {
      updateLikeButtonView();
    }
  }, [route, homeFeed, commentsUpdateCheck, newLikeCheck]);

  if (!feed || !currentUser) {
    return <View />;
  }

  return (
    <ContainerView
      touchEnabled={false}
      headerHeight={route.params.headerHeight}
    >
      <SelectionModal
        showModal={showPostOptions}
        onModalDismissPress={() => setShowPostOptions(false)}
        options={postOptions}
      />
      {showShareModal && (
        <ShareModal
          showModal={showShareModal}
          animationType="slide"
          onSharePress={handleShareAction}
          onShareOptionsPress={handleShareOptionsPress}
          onModalDismissPress={() => setShowShareModal(false)}
          onChangeText={(text) => setShareMessage(text)}
          descriptionValue={shareMessage}
        />
      )}
      <PhotoModal
        showModal={showImage}
        showIndex={0}
        items={imageShown}
        currentUser={currentUser}
        onSwipeDown={() => setShowImage(false)}
        onLikePress={(item) => handleLikePress(item, 'IMAGE')}
        onCommentPress={(item) => handleCommentsPress(item, 'SHARED_IMAGE')}
        onDescriptionChange={(text) => setShareMessage(text)}
        onSharePress={(index) => setCurrentItem(imageShown[index])}
        onShare={() => handleShareAction('IMAGE')}
        onShareOptionsPress={handleShareOptionsPress}
        shareDescriptionValue={shareMessage}
      />
      <AnimatedFlatList
        contentContainerStyle={[styles.contentContainer, { paddingBottom }]}
        data={feed}
        renderItem={renderItem}
        animationType={
          currentUser.settings.enableIntroAnimations
            ? AnimationType.Dive
            : AnimationType.None
        }
        scrollIndicatorInsets={{ right: 1 }}
        onScroll={({ nativeEvent }) => {
          if (fetching || endOfList) return;

          if (isCloseToBottom(nativeEvent)) {
            handleLoadMoreThrottled(homeFeed.length);
          }
        }}
        ListEmptyComponent={renderEmptyListText()}
        ListFooterComponent={renderListFooterComponent()}
        onViewableItemsChanged={onViewRef}
        viewabilityConfig={viewConfigRef}
        onRefresh={handleRefresh}
        refreshing={fetching}
        keyExtractor={(item) => item._id}
      />
    </ContainerView>
  );
};

Explore.defaultProps = {
  currentUser: null,
  commentsUpdateCheck: null,
  newLikeCheck: null,
};

Explore.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.instanceOf(Object),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: userPropType,
  homeFeed: PropTypes.arrayOf(exploreItemPropType).isRequired,
  endOfList: PropTypes.bool.isRequired,
  commentsUpdateCheck: PropTypes.shape({
    fromScreen: PropTypes.string,
    id: PropTypes.string.isRequired,
    commentId: PropTypes.string,
    type: PropTypes.string,
    action: PropTypes.string,
    comments: PropTypes.arrayOf(commentPropType),
  }),
  newLikeCheck: PropTypes.shape({
    fromScreen: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }),
};

const mapStateToProps = (state) => {
  const { homeFeed, endOfList, deletedPost, fetching } = state.home;
  const { user } = state.user;
  const { commentsUpdateCheck } = state.comments;
  const { newLikeCheck } = state.likes;

  return {
    homeFeed,
    endOfList,
    currentUser: user,
    commentsUpdateCheck,
    newLikeCheck,
    deletedPost,
    fetching,
  };
};

export default connect(mapStateToProps)(Explore);
