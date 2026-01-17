-- Create lyrics table linked to songs (global lyrics per song)
-- Run this once on your MySQL database.

CREATE TABLE IF NOT EXISTS song_lyrics (
  id INT NOT NULL AUTO_INCREMENT,
  song_id INT NOT NULL,
  lyrics_text LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_song_lyrics_song_id (song_id),
  CONSTRAINT fk_song_lyrics_song_id
    FOREIGN KEY (song_id) REFERENCES songs(id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
