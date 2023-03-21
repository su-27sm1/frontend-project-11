import { string, setLocale } from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import { uniqueId, flatten } from 'lodash';
import render from './view.js';
import resource from './locales/index.js';
import parseRSS from './utilities/parser.js';

const defaultLanguage = 'ru';
let timeout = 5000;

const prepareUrl = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app/get';
  const preparedURL = new URL(allOrigins);
  preparedURL.searchParams.set('disableCache', 'true');
  preparedURL.searchParams.set('url', url);
  return preparedURL;
};

const getResponse = (url) => {
  const preparedURL = prepareUrl(url);
  return axios.get(preparedURL);
};

const validate = (newURL, listAddedURLs) => {
  const schema = string().url().notOneOf(listAddedURLs);
  return schema.validate(newURL);
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

const DEFAULT_TIMEOUT = 5000; // время задержки между запросами

const postsUpdate = (watchedState) => {
  const inner = () => {
    const currentFeed = watchedState.uploadedData.feeds.find(
      (feed) => feed.link === watchedState.currentFeedLink
    );
    timeout = currentFeed?.updateTimeout || DEFAULT_TIMEOUT;

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
          // Добавляем новые посты в соответствующий фид в состоянии
          watchedState.uploadedData.feeds.forEach((feed) => {
            if (feed.link === watchedState.currentFeedLink) {
              feed.posts = [...feed.posts, ...newPosts];
            }
          });
          // Обновляем состояние
          watchedState.updateState();
        }
      })
      .catch(console.error)
      .finally(() => {
        setTimeout(inner, timeout);
      });
  };

  inner();
};

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance
    .init({
      lng: defaultLanguage,
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

      watchedState.uploadedData.feeds.forEach((feed) => {
        postsUpdate(feed.id, watchedState);
      });

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

            watchedState.uploadedData.feeds.push({
              ...parsedRSS,
              id: uniqueId(),
              link: state.inputData,
            });

            addPosts(feedId, parsedRSS.posts, watchedState);

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
