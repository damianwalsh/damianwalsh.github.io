#!/usr/bin/env node
import { program } from 'commander';
import pkg from 'enquirer';
const { prompt } = pkg;
import { promises as fs } from 'fs';
import { enrichMusicCollection } from './enrichMusic.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const RAW_DATA_PATH = path.join(process.cwd(), '_data/music.json');
const IMAGE_PATH = path.join(process.cwd(), 'content/music/img');

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

async function processImage(imagePath, title, artist) {
  const slugTitle = slugify(title);
  const slugAuthor = slugify(artist);
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

async function loadMusicCollection() {
  try {
    const data = await fs.readFile(RAW_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading music collection:', error);
    return [];
  }
}

async function saveMusicCollection(collection) {
  try {
    await fs.writeFile(RAW_DATA_PATH, JSON.stringify(collection, null, 2));
    console.log('✓ Music collection saved successfully');
  } catch (error) {
    console.error('Error saving music collection:', error);
  }
}

async function addRelease() {
  const collection = await loadMusicCollection();
  const answers = await prompt([
    {
      type: 'input',
      name: 'artist',
      message: 'Artist:',
      validate: input => input.trim() !== '' || 'Artist is required'
    },
    {
      type: 'input',
      name: 'title',
      message: 'Release title:',
      validate: input => input.trim() !== '' || 'Title is required'
    },
    {
      type: 'input',
      name: 'release_id',
      message: 'Discogs release ID:',
      validate: input => /^\d+$/.test(input) || 'Please enter a valid Discogs ID (numbers only)'
    },
    {
      type: 'select',
      name: 'format',
      message: 'Format:',
      choices: ['Vinyl', 'CD', 'Cassette', 'Digital']
    },
    {
      type: 'input',
      name: 'first_released',
      message: 'First released date (YYYY-MM-DD):',
      validate: input => {
        if (!input) return true; // Optional
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        return datePattern.test(input) || 'Please use format YYYY-MM-DD';
      }
    },
    {
      type: 'input',
      name: 'favourite_tracks',
      message: 'Favourite tracks (comma-separated track numbers, e.g. 1,3,5):',
      validate: input => {
        if (!input) return true; // Optional
        const trackPattern = /^\d+(,\d+)*$/;
        return trackPattern.test(input) || 'Please enter track numbers separated by commas';
      },
      result: input => input ? input.split(',').map(Number) : []
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
      message: 'Enrich this release with Discogs data?',
      initial: true
    }
  ]);

  const newRelease = {
    artist: answers.artist,
    title: answers.title,
    release_id: parseInt(answers.release_id),
    format: answers.format,
    favourite: answers.favourite
  };

  // Add optional fields if provided
  if (answers.first_released) {
    newRelease.first_released = answers.first_released;
  }

  if (answers.favourite_tracks && answers.favourite_tracks.length > 0) {
    newRelease.favourite_tracks = answers.favourite_tracks;
  }

  if (answers.coverImagePath && answers.coverImagePath.trim() !== '') {
    console.log('Processing cover image...');
    await processImage(answers.coverImagePath, answers.title, answers.artist);
  }

  // Add chapter memories if requested
  const shouldAddChapters = await prompt({
    type: 'confirm',
    name: 'addChapters',
    message: 'Add chapter memories now?',
    initial: false
  });

  if (shouldAddChapters.addChapters) {
    try {
      const chaptersData = await fs.readFile('_data/chapters.json', 'utf8');
      const chapters = JSON.parse(chaptersData);

      const chapterChoices = Object.entries(chapters).map(([id, chapter]) => ({
        name: id,
        message: chapter.title
      }));

      if (chapterChoices.length === 0) {
        console.log('No chapters found in _data/chapters.json');
      } else {
        const chapterAnswer = await prompt({
          type: 'multiselect',
          name: 'selectedChapters',
          message: 'Select chapters to associate with this release:',
          choices: chapterChoices
        });

        if (chapterAnswer.selectedChapters.length > 0) {
          newRelease.chapters = {};

          for (const chapterId of chapterAnswer.selectedChapters) {
            newRelease.chapters[chapterId] = await addChapterDetails(chapterId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  }

  collection.unshift(newRelease);
  await saveMusicCollection(collection);

  // Update bidirectional links if chapters were added
  if (newRelease.chapters) {
    console.log('Updating bidirectional links...');
    await updateBidirectionalLinks();
  }

  if (answers.enrich) {
    console.log('Enriching release with Discogs data...');
    await enrichMusicCollection();
  }

  console.log('✓ Release added successfully');
}

// Helper function to update bidirectional links
async function updateBidirectionalLinks() {
  try {
    // Import the musicManager script dynamically to avoid circular dependencies
    const { updateBidirectionalLinks } = await import('./musicManager.js');
    await updateBidirectionalLinks();
    console.log('✓ Bidirectional links updated successfully');
  } catch (error) {
    console.error('Error updating bidirectional links:', error);
  }
}

// Helper function to add people, places, and events to chapters
async function addChapterDetails(chapterId) {
  const chapterMemories = { people: [], places: [], events: [] };
  try {
    // Load data files
    const peopleData = await fs.readFile('_data/people.json', 'utf8');
    const placesData = await fs.readFile('_data/places.json', 'utf8');
    const eventsData = await fs.readFile('_data/events.json', 'utf8');
    const people = JSON.parse(peopleData);
    const places = JSON.parse(placesData);
    const events = JSON.parse(eventsData);

    // Format choices for people - REMOVE the selected property
    const peopleChoices = Object.entries(people).map(([id, person]) => ({
      name: id,
      message: person.name
    }));

    // Format choices for places - REMOVE the selected property
    const placesChoices = Object.entries(places).map(([id, place]) => ({
      name: id,
      message: place.location
    }));

    // Format choices for events - REMOVE the selected property AND use name instead of title
    const eventsChoices = Object.entries(events).map(([id, event]) => ({
      name: id,
      message: event.name || id
    }));

    // Prompt for people
    if (peopleChoices.length > 0) {
      const peopleAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedPeople',
        message: 'Select people to associate with this chapter:',
        choices: peopleChoices
      });
      chapterMemories.people = peopleAnswer.selectedPeople;
    }

    // Prompt for places
    if (placesChoices.length > 0) {
      const placesAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedPlaces',
        message: 'Select places to associate with this chapter:',
        choices: placesChoices
      });
      chapterMemories.places = placesAnswer.selectedPlaces;
    }

    // Prompt for events
    if (eventsChoices.length > 0) {
      const eventsAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedEvents',
        message: 'Select events to associate with this chapter:',
        choices: eventsChoices
      });
      chapterMemories.events = eventsAnswer.selectedEvents;
    }
  } catch (error) {
    console.error('Error loading entity data:', error);
  }
  return chapterMemories;
}

async function addChaptersToRelease() {
  const collection = await loadMusicCollection();
  if (collection.length === 0) {
    console.log('No releases found in collection');
    return;
  }

  // Format choices for releases
  const releaseChoices = collection
    .map((release, index) => ({
      index,
      name: index.toString(),
      message: `${release.artist} - ${release.title} (${release.format || ''})`,
      sortKey: `${release.artist} - ${release.title}`.toLowerCase()
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Prompt for release selection
  const releaseAnswer = await prompt({
    type: 'select',
    name: 'selectedRelease',
    message: 'Select a release to add chapters to:',
    choices: releaseChoices
  });

  const releaseIndex = parseInt(releaseAnswer.selectedRelease);
  const release = collection[releaseIndex];
  console.log(`Adding chapters to: ${release.artist} - ${release.title}`);

  // Load chapters data
  try {
    const chaptersData = await fs.readFile('_data/chapters.json', 'utf8');
    const chapters = JSON.parse(chaptersData);

    const chapterChoices = Object.entries(chapters).map(([id, chapter]) => ({
      name: id,
      message: chapter.title,
      // Indicate if this chapter is already associated
      disabled: release.chapters && release.chapters[id] ? '(already added)' : false
    }));

    // Filter out already-associated chapters
    const availableChapters = chapterChoices.filter(choice => !choice.disabled);

    if (availableChapters.length === 0) {
      console.log('This release is already associated with all available chapters.');
      return;
    }

    const chapterAnswer = await prompt({
      type: 'multiselect',
      name: 'selectedChapters',
      message: 'Select chapters to associate with this release:',
      choices: availableChapters
    });

    if (chapterAnswer.selectedChapters.length > 0) {
      // Initialize chapters object if it doesn't exist
      if (!release.chapters) {
        release.chapters = {};
      }

      for (const chapterId of chapterAnswer.selectedChapters) {
        release.chapters[chapterId] = await addChapterDetails(chapterId);
      }

      await saveMusicCollection(collection);

      console.log('Updating bidirectional links...');
      await updateBidirectionalLinks();

      console.log('✓ Release updated successfully with new chapters');
    } else {
      console.log('No chapters selected, release was not updated.');
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

async function editChapterDetails() {
  const collection = await loadMusicCollection();
  if (collection.length === 0) {
    console.log('No releases found in collection');
    return;
  }

  // Format choices for releases
  const releaseChoices = collection
    .map((release, index) => ({
      index,
      name: index.toString(),
      message: `${release.artist} - ${release.title} (${release.format || ''})`,
      sortKey: `${release.artist} - ${release.title}`.toLowerCase()
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Prompt for release selection
  const releaseAnswer = await prompt({
    type: 'select',
    name: 'selectedRelease',
    message: 'Select a release to edit chapter details:',
    choices: releaseChoices
  });

  const releaseIndex = parseInt(releaseAnswer.selectedRelease);
  const release = collection[releaseIndex];
  console.log(`Editing chapters for: ${release.artist} - ${release.title}`);

  if (!release.chapters || Object.keys(release.chapters).length === 0) {
    console.log('This release has no associated chapters. Use add-chapters command instead.');
    return;
  }

  // Load chapters data
  try {
    const chaptersData = await fs.readFile('_data/chapters.json', 'utf8');
    const chapters = JSON.parse(chaptersData);

    const chapterChoices = Object.entries(release.chapters).map(([chapterId, chapterMemories]) => ({
      name: chapterId,
      message: chapters[chapterId]?.title || chapterId
    }));

    // Prompt for chapter selection
    const chapterAnswer = await prompt({
      type: 'select',
      name: 'selectedChapter',
      message: 'Select a chapter to edit:',
      choices: chapterChoices
    });

    const chapterId = chapterAnswer.selectedChapter;

    // Get current chapter memories
    const currentMemories = release.chapters[chapterId] || { people: [], places: [], events: [] };

    // Load data files
    const peopleData = await fs.readFile('_data/people.json', 'utf8');
    const placesData = await fs.readFile('_data/places.json', 'utf8');
    const eventsData = await fs.readFile('_data/events.json', 'utf8');
    const people = JSON.parse(peopleData);
    const places = JSON.parse(placesData);
    const events = JSON.parse(eventsData);

    // Format choices for people
    const peopleChoices = Object.entries(people).map(([id, person]) => ({
      name: id,
      message: person.name,
      // Mark already selected people
      selected: currentMemories.people.includes(id)
    }));

    // Format choices for places
    const placesChoices = Object.entries(places).map(([id, place]) => ({
      name: id,
      message: place.location,
      // Mark already selected places
      selected: currentMemories.places.includes(id)
    }));

    // Format choices for events
    const eventsChoices = Object.entries(events).map(([id, event]) => ({
      name: id,
      message: event.name || id,
      // Mark already selected events
      selected: currentMemories.events.includes(id)
    }));

    // Prompt for updated selections
    const updatedMemories = { people: [], places: [], events: [] };

    // Prompt for people
    if (peopleChoices.length > 0) {
      const peopleAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedPeople',
        message: 'Select people to associate with this chapter:',
        choices: peopleChoices
      });
      updatedMemories.people = peopleAnswer.selectedPeople;
    }

    // Prompt for places
    if (placesChoices.length > 0) {
      const placesAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedPlaces',
        message: 'Select places to associate with this chapter:',
        choices: placesChoices
      });
      updatedMemories.places = placesAnswer.selectedPlaces;
    }

    // Prompt for events
    if (eventsChoices.length > 0) {
      const eventsAnswer = await prompt({
        type: 'multiselect',
        name: 'selectedEvents',
        message: 'Select events to associate with this chapter:',
        choices: eventsChoices
      });
      updatedMemories.events = eventsAnswer.selectedEvents;
    }

    // Update the chapter details
    release.chapters[chapterId] = updatedMemories;
    await saveMusicCollection(collection);

    console.log('Updating bidirectional links...');
    await updateBidirectionalLinks();

    console.log('✓ Chapter details updated successfully');
  } catch (error) {
    console.error('Error updating chapter details:', error);
  }
}

async function addPerson() {
  try {
    const peopleData = await fs.readFile('_data/people.json', 'utf8');
    const people = JSON.parse(peopleData);
    const answers = await prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Person ID (slug):',
        validate: input => {
          const sanitized = input.trim().toLowerCase().replace(/\s+/g, '-');
          if (sanitized === '') return 'ID is required';
          if (people[sanitized]) return 'This ID already exists';
          return true;
        },
        result: input => input.trim().toLowerCase().replace(/\s+/g, '-')
      },
      {
        type: 'input',
        name: 'name',
        message: 'Person name:',
        validate: input => input.trim() !== '' || 'Name is required'
      },
      {
        type: 'input',
        name: 'relationship',
        message: 'Relationship:',
        validate: input => input.trim() !== '' || 'Relationship is required'
      }
    ]);
    people[answers.id] = {
      name: answers.name,
      relationship: answers.relationship,
      related_releases: []
    };
    await fs.writeFile('_data/people.json', JSON.stringify(people, null, 2) + '\n');
    console.log(`✓ Person "${answers.name}" added successfully`);
  } catch (error) {
    console.error('Error adding person:', error);
  }
}

async function addPlace() {
  try {
    const placesData = await fs.readFile('_data/places.json', 'utf8');
    const places = JSON.parse(placesData);
    const answers = await prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Place ID (slug):',
        validate: input => {
          const sanitized = input.trim().toLowerCase().replace(/\s+/g, '-');
          if (sanitized === '') return 'ID is required';
          if (places[sanitized]) return 'This ID already exists';
          return true;
        },
        result: input => input.trim().toLowerCase().replace(/\s+/g, '-')
      },
      {
        type: 'input',
        name: 'location',
        message: 'Location name:',
        validate: input => input.trim() !== '' || 'Location is required'
      },
      {
        type: 'input',
        name: 'lat',
        message: 'Latitude:',
        validate: input => {
          if (input.trim() === '') return 'Latitude is required';
          const lat = parseFloat(input);
          if (isNaN(lat)) return 'Latitude must be a number';
          if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
          return true;
        },
        result: input => parseFloat(input)
      },
      {
        type: 'input',
        name: 'lng',
        message: 'Longitude:',
        validate: input => {
          if (input.trim() === '') return 'Longitude is required';
          const lng = parseFloat(input);
          if (isNaN(lng)) return 'Longitude must be a number';
          if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
          return true;
        },
        result: input => parseFloat(input)
      }
    ]);
    places[answers.id] = {
      location: answers.location,
      coordinates: {
        lat: answers.lat,
        lng: answers.lng
      },
      related_releases: []
    };
    await fs.writeFile('_data/places.json', JSON.stringify(places, null, 2) + '\n');
    console.log(`✓ Place "${answers.location}" added successfully`);
  } catch (error) {
    console.error('Error adding place:', error);
  }
}

async function addEvent() {
  try {
    const eventsData = await fs.readFile('_data/events.json', 'utf8');
    const events = JSON.parse(eventsData);
    const answers = await prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Event ID (slug):',
        validate: input => {
          const sanitized = input.trim().toLowerCase().replace(/\s+/g, '-');
          if (sanitized === '') return 'ID is required';
          if (events[sanitized]) return 'This ID already exists';
          return true;
        },
        result: input => input.trim().toLowerCase().replace(/\s+/g, '-')
      },
      {
        type: 'input',
        name: 'name',
        message: 'Event name:',
        validate: input => input.trim() !== '' || 'Name is required'
      },
      {
        type: 'input',
        name: 'location',
        message: 'Event location:',
        validate: input => input.trim() !== '' || 'Location is required'
      },
      {
        type: 'input',
        name: 'type',
        message: 'Event type:',
        validate: input => input.trim() !== '' || 'Type is required'
      },
      {
        type: 'input',
        name: 'date',
        message: 'Date (YYYY-MM-DD):',
        validate: input => {
          if (!input) return true; // Optional
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          return datePattern.test(input) || 'Please use format YYYY-MM-DD';
        }
      },
      {
        type: 'input',
        name: 'setlistfm_id',
        message: 'Setlist.fm ID (leave empty if not a concert):'
      },
      {
        type: 'input',
        name: 'lat',
        message: 'Latitude:',
        validate: input => {
          if (input.trim() === '') return 'Latitude is required';
          const lat = parseFloat(input);
          if (isNaN(lat)) return 'Latitude must be a number';
          if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
          return true;
        },
        result: input => parseFloat(input)
      },
      {
        type: 'input',
        name: 'lng',
        message: 'Longitude:',
        validate: input => {
          if (input.trim() === '') return 'Longitude is required';
          const lng = parseFloat(input);
          if (isNaN(lng)) return 'Longitude must be a number';
          if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
          return true;
        },
        result: input => parseFloat(input)
      }
    ]);
    events[answers.id] = {
      name: answers.name,
      location: answers.location,
      type: answers.type,
      date: answers.date || null,
      setlistfm_id: answers.setlistfm_id || null,
      coordinates: {
        lat: answers.lat,
        lng: answers.lng
      },
      related_releases: []
    };
    await fs.writeFile('_data/events.json', JSON.stringify(events, null, 2) + '\n');
    // Ask to enrich the event if it has a setlist.fm ID
    if (answers.setlistfm_id) {
      const shouldEnrich = await prompt({
        type: 'confirm',
        name: 'enrich',
        message: 'Enrich this event with Setlist.fm data?',
        initial: true
      });
      if (shouldEnrich.enrich) {
        console.log('Enriching event with Setlist.fm data...');
        const { enrichEventsCollection } = await import('./enrichEvents.js');
        await enrichEventsCollection();
      }
    }
    console.log(`✓ Event "${answers.name}" added successfully`);
  } catch (error) {
    console.error('Error adding event:', error);
  }
}

async function editRelease() {
  const collection = await loadMusicCollection();

  if (collection.length === 0) {
    console.log('No releases found in collection');
    return;
  }

  // Format choices for releases - WITH SORTING
  const releaseChoices = collection
    .map((release, index) => ({
      index,
      name: index.toString(),
      message: `${release.artist} - ${release.title} (${release.format || ''})`,
      sortKey: `${release.artist} - ${release.title}`.toLowerCase()
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Prompt for release selection
  const releaseAnswer = await prompt({
    type: 'select',
    name: 'selectedRelease',
    message: 'Select a release to edit:',
    choices: releaseChoices
  });

  const releaseIndex = parseInt(releaseAnswer.selectedRelease);
  const release = collection[releaseIndex];

  console.log(`Editing: ${release.artist} - ${release.title}`);

  // Get current values
  const currentFavourite = release.favourite || false;
  const currentFavouriteTracks = release.favourite_tracks || [];

  // Prompt for updates
  const answers = await prompt([
    {
      type: 'confirm',
      name: 'favourite',
      message: 'Mark as favourite?',
      initial: currentFavourite
    },
    {
      type: 'input',
      name: 'favourite_tracks',
      message: 'Favourite tracks (comma-separated track numbers, e.g. 1,3,5):',
      initial: currentFavouriteTracks.join(','),
      validate: input => {
        if (!input) return true; // Optional
        const trackPattern = /^\d+(,\d+)*$/;
        return trackPattern.test(input) || 'Please enter track numbers separated by commas';
      },
      result: input => input ? input.split(',').map(Number) : []
    }
  ]);

  // Update the release
  release.favourite = answers.favourite;
  release.favourite_tracks = answers.favourite_tracks;

  await saveMusicCollection(collection);

  // Update the enriched data too
  try {
    const enrichedDataPath = path.join(process.cwd(), '_data/enriched/music.json');
    const enrichedData = JSON.parse(await fs.readFile(enrichedDataPath, 'utf8'));

    // Find the matching release in the enriched data
    const enrichedRelease = enrichedData.releases.find(r => r.release_id === release.release_id);

    if (enrichedRelease) {
      // Update the favourite and favourite_tracks fields
      enrichedRelease.favourite = release.favourite;
      enrichedRelease.favourite_tracks = release.favourite_tracks;

      // Save the updated enriched data
      await fs.writeFile(enrichedDataPath, JSON.stringify(enrichedData, null, 2));
      console.log('✓ Enriched music data updated successfully');
    } else {
      console.warn(`Release ${release.release_id} not found in enriched data`);
    }
  } catch (error) {
    console.error('Error updating enriched music data:', error);
  }

  console.log('✓ Release updated successfully');
}

program
  .name('music-cli')
  .description('CLI to manage music collection')
  .version('1.0.0');

program
  .command('add-release')
  .description('Add new release')
  .action(addRelease);

program
  .command('add-chapters')
  .description('Add chapters to an existing release')
  .action(addChaptersToRelease);

program
  .command('edit-chapter')
  .description('Edit chapter details for an existing release')
  .action(editChapterDetails);

program
  .command('add-person')
  .description('Add new person')
  .action(addPerson);

program
  .command('add-place')
  .description('Add new place')
  .action(addPlace);

program
  .command('add-event')
  .description('Add new event')
  .action(addEvent);

program
  .command('edit-release')
  .description('Edit existing release')
  .action(editRelease);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
