#!/usr/bin/env node
import { program } from 'commander';
import pkg from 'enquirer';
const { prompt } = pkg;
import { promises as fs } from 'fs';
import { enrichReadingList } from './enrichReading.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import slugify from '@sindresorhus/slugify';

const execAsync = promisify(exec);
const RAW_DATA_PATH = path.join(process.cwd(), '_data/reading.json');
const IMAGE_PATH = path.join(process.cwd(), 'content/reading/img');

const GENRES = [
  'Art & Design',
  'Biography',
  'Business & Management',
  'Comics',
  'Crime',
  'Essays',
  'Fantasy',
  'Fiction',
  'Food Writing',
  'Gardening',
  'Graphic Novel',
  'Health',
  'Historical Fiction',
  'History',
  'Horror',
  'Japan',
  'Memoir',
  'Music',
  'Mystery',
  'Non-Fiction',
  'Philosophy',
  'Photography',
  'Poetry',
  'Politics',
  'Programming',
  'Psychedelics',
  'Psychology',
  'Reference',
  'Romance',
  'Science',
  'Science Fiction',
  'Self-Help',
  'Spirituality',
  'Thriller',
  'Travel'
];

async function processImage(imagePath, title, author) {
  const slugTitle = slugify(title.trim(), { decamelize: false });
  const slugAuthor = slugify(author.trim(), { decamelize: false });
  const outputFilename = `${slugTitle}-${slugAuthor}.jpg`;
  const outputPath = path.join(IMAGE_PATH, outputFilename);

  try {
    await fs.mkdir(IMAGE_PATH, { recursive: true });
    const cleanPath = imagePath.replace(/['"]/g, '').trim();
    const command = `magick "${cleanPath}" -resize "670x>" "${outputPath}"`;
    await execAsync(command);

    console.log(`✓ Image processed and saved as ${outputFilename}`);
    return outputFilename;
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

async function loadReadingList() {
  try {
    const data = await fs.readFile(RAW_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading reading list:', error);
    return [];
  }
}

async function saveReadingList(books) {
  try {
    await fs.writeFile(RAW_DATA_PATH, JSON.stringify(books, null, 2));
    console.log('✓ Reading list saved successfully');
  } catch (error) {
    console.error('Error saving reading list:', error);
  }
}

async function addBook() {
  const books = await loadReadingList();

  const answers = await prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Book title:',
      validate: input => input.trim() !== '' || 'Title is required'
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      validate: input => input.trim() !== '' || 'Author is required'
    },
    {
      type: 'input',
      name: 'openlibrary_key',
      message: 'OpenLibrary key (format: OL...W):',
      validate: input => {
        return /^OL\w+W$/.test(input) || 'Please enter a valid OpenLibrary key (OL...W)';
      }
    },
    {
      type: 'input',
      name: 'date_read',
      message: 'Date read (YYYY-MM-DD):',
      validate: input => {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        return datePattern.test(input) || 'Please use format YYYY-MM-DD';
      }
    },
    {
      type: 'confirm',
      name: 'favourite',
      message: 'Mark as favourite?',
      initial: false
    },
    {
      type: 'multiselect',
      name: 'genres',
      message: 'Select genres (use space to select, enter to confirm):',
      choices: GENRES
    },
    {
      type: 'input',
      name: 'coverImagePath',
      message: 'Path to cover image (leave empty to skip):',
    },
    {
      type: 'confirm',
      name: 'enrich',
      message: 'Enrich this book with OpenLibrary data?',
      initial: true
    }
  ]);

  const newBook = {
    title: answers.title,
    author: answers.author,
    openlibrary_key: answers.openlibrary_key,
    date_read: answers.date_read,
    favourite: answers.favourite,
    genres: answers.genres
  };

  if (answers.coverImagePath && answers.coverImagePath.trim() !== '') {
    console.log('Processing cover image...');
    await processImage(answers.coverImagePath, answers.title, answers.author);
  }

  books.unshift(newBook);
  await saveReadingList(books);

  if (answers.enrich) {
    console.log('Enriching book data from OpenLibrary...');
    await enrichReadingList();
  }

  console.log('✓ Book added successfully');
}

async function editBookGenres() {
  const books = await loadReadingList();

  if (books.length === 0) {
    console.log('No books in your reading list.');
    return;
  }

  const bookChoices = books
    .map((book, index) => ({
      index,
      name: `${index}`,
      message: `${book.author} - ${book.title} (${book.date_read || 'No date'})`,
      sortKey: `${book.author} - ${book.title}`.toLowerCase()
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const { bookIndex } = await prompt({
    type: 'select',
    name: 'bookIndex',
    message: 'Select a book to edit genres:',
    choices: bookChoices
  });

  const selectedChoice = bookChoices.find(choice => choice.name === bookIndex);

  if (!selectedChoice) {
    console.error('Error: Could not find selected book');
    return;
  }

  const originalIndex = selectedChoice.index;
  const selectedBook = books[originalIndex];
  const currentGenres = selectedBook.genres || [];

  console.log(`\nCurrent genres for "${selectedBook.title}": ${currentGenres.length ? currentGenres.join(', ') : 'None'}\n`);

  const genreChoices = GENRES.map(genre => ({
    name: genre,
    message: genre,
    selected: currentGenres.includes(genre)
  }));

  const { genres } = await prompt({
    type: 'multiselect',
    name: 'genres',
    message: 'Select genres (use space to select/unselect, enter to confirm):',
    choices: genreChoices
  });

  books[originalIndex].genres = genres;
  await saveReadingList(books);

  try {
    const enrichedDataPath = path.join(process.cwd(), '_data/enriched/reading.json');
    const enrichedData = JSON.parse(await fs.readFile(enrichedDataPath, 'utf8'));

    const enrichedBook = enrichedData.current.find(b =>
      b.openlibrary_key === selectedBook.openlibrary_key &&
      b.title === selectedBook.title
    );

    if (enrichedBook) {
      enrichedBook.genres = genres;
      await fs.writeFile(enrichedDataPath, JSON.stringify(enrichedData, null, 2));
      console.log('✓ Enriched reading data updated successfully');
    } else {
      console.warn(`Book "${selectedBook.title}" not found in enriched data`);
    }
  } catch (error) {
    console.error('Error updating enriched reading data:', error);
  }

  console.log(`✓ Genres updated for "${selectedBook.title}" by ${selectedBook.author}`);
}


program
  .name('reading-cli')
  .description('CLI to manage reading list')
  .version('1.0.0');

program
  .command('add')
  .description('Add new book to reading list')
  .action(addBook);

program
  .command('edit-genres')
  .description('Edit genres for book in reading list')
  .action(editBookGenres);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
