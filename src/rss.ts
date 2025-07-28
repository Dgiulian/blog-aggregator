import { XMLParser } from "fast-xml-parser";
import { getAllFeeds } from "./lib/db/queries/feeds";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });
  const xmlText = await response.text();

  const parser = new XMLParser();
  const parsed = parser.parse(xmlText);

  if (!parsed.rss || !parsed.rss.channel) {
    throw new Error("Invalid RSS feed");
  }

  const channel = parsed.rss.channel;

  if (!channel.title || !channel.link || !channel.description) {
    throw new Error("Missing channel metadata");
  }

  let items: RSSItem[] = [];
  if (channel.item) {
    if (Array.isArray(channel.item)) {
      items = channel.item
        .map((item: any) => {
          if (item.title && item.link && item.description && item.pubDate) {
            return {
              title: item.title,
              link: item.link,
              description: item.description,
              pubDate: item.pubDate,
            };
          }
          return null;
        })
        .filter((item: RSSItem | null): item is RSSItem => item !== null);
    } else {
      if (
        channel.item.title &&
        channel.item.link &&
        channel.item.description &&
        channel.item.pubDate
      ) {
        items.push({
          title: channel.item.title,
          link: channel.item.link,
          description: channel.item.description,
          pubDate: channel.item.pubDate,
        });
      }
    }
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}

export async function listAllFeeds() {
  const feeds = await getAllFeeds();
  for (let feed of feeds) {
    console.log(`${feed.name} - ${feed.url}. Created by ${feed.user?.name}`);
  }
}
