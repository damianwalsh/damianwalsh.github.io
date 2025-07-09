import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

async function updateBidirectionalLinks() {
  try {
    const musicCollection = JSON.parse(
      await fs.readFile('_data/music.json', 'utf8')
    );
    const people = JSON.parse(
      await fs.readFile('_data/people.json', 'utf8')
    );
    const places = JSON.parse(
      await fs.readFile('_data/places.json', 'utf8')
    );
    const chapters = JSON.parse(
      await fs.readFile('_data/chapters.json', 'utf8')
    );
    const events = JSON.parse(
      await fs.readFile('_data/events.json', 'utf8')
    );

    // Initialize empty arrays for related_releases
    Object.values(people).forEach(person => {
      person.related_releases = [];
    });
    Object.values(places).forEach(place => {
      place.related_releases = [];
    });
    Object.values(chapters).forEach(chapter => {
      chapter.related_releases = [];
    });
    Object.values(events).forEach(event => {
      event.related_releases = [];
    });

    // Update connections
    musicCollection.forEach(release => {
      const releaseId = release.release_id;
      if (release.chapters) {
        Object.entries(release.chapters).forEach(([chapterId, chapterMemories]) => {
          // Add to chapter
          chapters[chapterId].related_releases.push(releaseId);

          // Add to people
          chapterMemories.people?.forEach(personId => {
            people[personId].related_releases.push(releaseId);
          });

          // Add to places
          chapterMemories.places?.forEach(placeId => {
            places[placeId].related_releases.push(releaseId);
          });

          // Add to events
          chapterMemories.events?.forEach(eventId => {
            events[eventId].related_releases.push(releaseId);
          });
        });
      }
    });

    // Write updated data back to files
    await fs.writeFile('_data/chapters.json', JSON.stringify(chapters, null, 2) + '\n');
    await fs.writeFile('_data/people.json', JSON.stringify(people, null, 2) + '\n');
    await fs.writeFile('_data/places.json', JSON.stringify(places, null, 2) + '\n');
    await fs.writeFile('_data/events.json', JSON.stringify(events, null, 2) + '\n');

    try {
      const enrichedMusic = JSON.parse(
        await fs.readFile('_data/enriched/music.json', 'utf8')
      );

      // Update chapters in the enriched data
      musicCollection.forEach(rawRelease => {
        const enrichedRelease = enrichedMusic.releases.find(
          r => r.release_id === rawRelease.release_id
        );
        if (enrichedRelease && rawRelease.chapters) {
          enrichedRelease.chapters = rawRelease.chapters;
        }
      });

      // Write updated enriched data back
      await fs.writeFile(
        '_data/enriched/music.json',
        JSON.stringify(enrichedMusic, null, 2)
      );
    } catch (error) {
      console.error('Error updating enriched music data:', error);
    }
  } catch (error) {
    console.error('Error updating links:', error);
  }
}

export { updateBidirectionalLinks };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateBidirectionalLinks();
}
