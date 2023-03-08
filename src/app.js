/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable comma-dangle */
/* eslint-disable operator-linebreak */
import { string, setLocale } from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import { uniqueId, flatten } from 'lodash';
import render from './view.js';
import resource from './locales/index.js';
import parseRSS from './utilities/parser.js';

const language = 'en';
const timeout = 5000;

const getResponse = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app/get';
  const preparedURL = new URL(allOrigins);
  preparedURL.searchParams.set('disableCache', 'true');
  preparedURL.searchParams.set('url', url);
  return axios.get(preparedURL);
};

const validate = (newURL, listAddedURLs) => {
  const schema = string().url().notOneOf(listAddedURLs).trim();
  return schema.validate(newURL);
};

const addFeeds = (id, parsedFeed, link, watchedState) => {
  watchedState.uploadedData.feeds.push({ ...parsedFeed, id, link });
};

const addPosts = (feedId, posts, watchedState) => {
  const preparedPosts = posts.map((post) => ({
    ...post,
    feedId,
    id: uniqueId(),
  }));
  watchedState.uploadedData.posts = preparedPosts.concat(
    watchedState.uploadedData.posts
  );
};

const postsUpdate = (feedId, watchedState) => {
  const inner = () => {
    const linkesFeed = watchedState.uploadedData.feeds.map(({ link }) =>
      getResponse(link)
    );

    Promise.allSettled(linkesFeed)
      .then((responses) => {
        const postsParsed = responses
          .filter(({ status }) => status === 'fulfilled')
          .map(({ value }) => {
            try {
              const parsedData = parseRSS(value.data.contents);
              return parsedData.posts;
            } catch (e) {
              console.error(e);
              return [];
            }
          });
        const receivedPosts = flatten(postsParsed);
        const linkPosts = watchedState.uploadedData.posts.map(
          ({ link }) => link
        );
        const newPosts = receivedPosts.filter(
          ({ link }) => !linkPosts.includes(link)
        );
        if (newPosts.length > 0) {
          addPosts(feedId, newPosts, watchedState);
        }
      })
      .catch(console.error)
      .finally(() => {
        setTimeout(inner, timeout);
      });
  };
  setTimeout(inner, timeout);
};

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance
    .init({
      lng: language,
      debug: false,
      resources: resource,
    })
    .then(() => {
      const elements = {
        form: document.querySelector('form'),
        input: document.querySelector('input'),
        feedback: document.querySelector('.feedback'),
        btn: document.querySelector('button[type="submit"]'),
        posts: document.querySelector('.posts'),
        feeds: document.querySelector('.feeds'),
        modal: {
          modalElement: document.querySelector('.modal'),
          title: document.querySelector('.modal-title'),
          body: document.querySelector('.modal-body'),
          fullArticleButton: document.querySelector('.full-article'),
        },
      };

      setLocale({
        mixed: {
          notOneOf: 'rssAlreadyExists',
          defaultError: 'dataIsNotValid',
        },
        string: {
          url: 'notValidURL',
        },
      });

      const state = {
        inputData: '',
        processOfAddingRss: {
          state: 'filling',
          error: '',
        },
        uploadedData: {
          feeds: [],
          posts: [],
        },
        readPostIds: new Set(),
        modalPostId: '',
      };

      const watchedState = onChange(
        state,
        render(state, elements, i18nInstance)
      );

      elements.form.addEventListener('input', (e) => {
        e.preventDefault();
        watchedState.inputData = e.target.value;
      });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listAddedURLs = state.uploadedData.feeds.map(({ link }) => link);

        validate(state.inputData, listAddedURLs)
          .then(() => {
            watchedState.processOfAddingRss.state = 'sending';
            return getResponse(state.inputData);
          })
          .then((response) => {
            const parsedRSS = parseRSS(response.data.contents);
            const feedId = uniqueId();

            addFeeds(feedId, parsedRSS.feed, state.inputData, watchedState);
            addPosts(feedId, parsedRSS.posts, watchedState);

            postsUpdate(feedId, watchedState);

            watchedState.processOfAddingRss.state = 'finished';
          })
          .catch((err) => {
            watchedState.processOfAddingRss.error =
              err.message ?? 'defaultError';
            watchedState.processOfAddingRss.state = 'failed';
          });
      });

      elements.modal.modalElement.addEventListener('show.bs.modal', (e) => {
        const postId = e.relatedTarget.getAttribute('data-id');
        watchedState.readPostIds.add(postId);
        watchedState.modalPostId = postId;
      });

      elements.posts.addEventListener('click', (e) => {
        const postId = e.target.dataset.id;
        if (postId) {
          watchedState.readPostIds.add(postId);
        }
      });
    });
};
