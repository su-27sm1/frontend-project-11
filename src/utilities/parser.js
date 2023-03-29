export default (contents) => {
  const domParser = new DOMParser();
  const xmlDocument = domParser.parseFromString(contents, 'text/xml');
  const rootTagName = xmlDocument.documentElement.tagName.toLowerCase();
  if (rootTagName !== 'rss') {
    throw new Error('noRSS');
  }

  const channel = xmlDocument.querySelector('channel');
  const channelTitle = channel.querySelector('title').textContent;
  const channelDescription = channel.querySelector('description').textContent;
  const feed = { title: channelTitle, description: channelDescription };

  const itemElements = channel.querySelectorAll('item');
  const posts = [...itemElements].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return {
      title,
      description,
      link,
    };
  });

  return { feed, posts };
};
