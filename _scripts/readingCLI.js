#!/usr/bin/env node
import { program } from 'commander';
import pkg from 'enquirer';
const { prompt } = pkg;
import { promises as fs } from 'fs';
import { enrichReadingList } from './enrichReading.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const RAW_DATA_PATH = path.join(process.cwd(), '_data/reading.json');
const IMAGE_PATH = path.join(process.cwd(), 'content/reading/img');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function processImage(imagePath, title, author) {
  const slugTitle = slugify(title);
  const slugAuthor = slugify(author);
  const outputFilename = `${slugTitle}-${slugAuthor}.jpg`;
  const outputPath = path.join(IMAGE_PATH, outputFilename);

  try {
    await fs.mkdir(IMAGE_PATH, { recursive: true });
    const cleanPath = imagePath.replace(/['"]/g, '');
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
    favourite: answers.favourite
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

program
  .name('reading-cli')
  .description('CLI to manage reading list')
  .version('1.0.0');

program
  .command('add')
  .description('Add new book to reading list')
  .action(addBook);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
