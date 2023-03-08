/* eslint-disable comma-dangle */
export default (content) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(content, 'text/xml');
  const rootTagName = xmlDocument.documentElement.tagName.toLowerCase();
  if (rootTagName !== 'rss') {
    throw new Error('noRSS');
  }

  const channel = xmlDocument.querySelector('channel');
  const channelTitle = xmlDocument.querySelector('channel title').textContent;
  const channelDescription = xmlDocument.querySelector(
    'channel description'
  ).textContent;
  const feed = { title: channelTitle, description: channelDescription };

  const itemElements = channel.getElementsByTagName('item');
  const posts = [...itemElements].map((post) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;
    const link = post.querySelector('channel link').textContent;
    return {
      title,
      description,
      link,
    };
  });

  return { feed, posts };
};
