import "dotenv/config";
import EleventyFetch from "@11ty/eleventy-fetch";
import { promises as fs } from 'fs';

const OPENLIBRARY_USER_AGENT = process.env.USER_AGENT;

async function fetchOpenLibraryData(url) {
  return EleventyFetch(url, {
    duration: "1d",
    type: "json",
    fetchOptions: {
      headers: {
        'User-Agent': OPENLIBRARY_USER_AGENT,
        'Accept': 'application/json'
      }
    }
  });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchBookDetails(book) {
  if (!book.openlibrary_key) {
    console.error('No OpenLibrary ID provided for book:', book.title);
    return book;
  }
  const url = `https://openlibrary.org/works/${book.openlibrary_key}.json`;
  try {
    const bookDetails = await fetchOpenLibraryData(url);
    await delay(1000);
    return {
      ...book,
      subjects: bookDetails.subjects || [],
      first_publish_date: bookDetails.first_publish_date,
      description: typeof bookDetails.description === 'object'
        ? bookDetails.description.value || ''
        : bookDetails.description || ''
    };
  } catch (error) {
    console.error(`Error fetching details for ${book.title}:`, error);
    return book;
  }
}

export default async function () {
  try {
    const localData = await fs.readFile('_data/readingList.json', 'utf8');
    const myBooks = JSON.parse(localData);

    const readingList = {
      current: await Promise.all(myBooks.map(fetchBookDetails))
    };

    return readingList;
  } catch (error) {
    console.error('Error processing book list:', error);
    return { current: [] };
  }
}
