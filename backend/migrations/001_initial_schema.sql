-- FNAF Game Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Player profiles (game progress)
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    highest_night_completed INTEGER DEFAULT 0,
    total_nights_survived INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_playtime_seconds BIGINT DEFAULT 0,
    pizza_slices_collected INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    easy_mode_enabled BOOLEAN DEFAULT false,
    unlocked_skins JSONB DEFAULT '[]'::jsonb,
    unlocked_decorations JSONB DEFAULT '[]'::jsonb,
    equipped_decorations JSONB DEFAULT '[]'::jsonb,
    jukebox_songs JSONB DEFAULT '[]'::jsonb,
    audio_volume DECIMAL(3,2) DEFAULT 1.0,
    music_volume DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(50) PRIMARY KEY,
    name_key VARCHAR(100) NOT NULL,
    description_key VARCHAR(200) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    points INTEGER DEFAULT 10,
    is_secret BOOLEAN DEFAULT false,
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Player achievements (many-to-many)
CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    progress JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, achievement_id)
);

-- Game sessions (for analytics and leaderboards)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL,
    night_number INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    survived BOOLEAN,
    final_power INTEGER,
    time_survived_seconds INTEGER,
    star_rating INTEGER,
    score INTEGER DEFAULT 0,
    death_by VARCHAR(50),
    power_ups_used JSONB DEFAULT '[]'::jsonb,
    pizza_slices_found INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    easy_mode BOOLEAN DEFAULT false,
    custom_difficulty JSONB
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    leaderboard_type VARCHAR(50) NOT NULL,
    score BIGINT NOT NULL,
    additional_data JSONB,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, leaderboard_type)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type_score ON leaderboard_entries(leaderboard_type, score DESC);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE NOT NULL UNIQUE,
    challenge_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    name_key VARCHAR(100) NOT NULL,
    description_key VARCHAR(200) NOT NULL,
    reward_points INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player daily challenge completions
CREATE TABLE IF NOT EXISTS daily_challenge_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER,
    time_seconds INTEGER,
    UNIQUE(user_id, challenge_id)
);

-- Multiplayer game rooms
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_mode VARCHAR(50) NOT NULL,
    max_players INTEGER DEFAULT 2,
    current_players INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'waiting',
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Multiplayer room participants
CREATE TABLE IF NOT EXISTS multiplayer_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(50),
    role VARCHAR(50),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_ready BOOLEAN DEFAULT false
);

-- Pizza slice progress
CREATE TABLE IF NOT EXISTS pizza_slice_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slice_id VARCHAR(50) NOT NULL,
    found_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, slice_id)
);

-- Insert default achievements
INSERT INTO achievements (id, name_key, description_key, icon, category, points, is_secret, requirements) VALUES
('survive_night_1', 'ach_survive_n1', 'ach_survive_n1_desc', '🌙', 'survival', 10, false, '{"night": 1}'),
('survive_night_2', 'ach_survive_n2', 'ach_survive_n2_desc', '🌙', 'survival', 15, false, '{"night": 2}'),
('survive_night_3', 'ach_survive_n3', 'ach_survive_n3_desc', '🌙', 'survival', 20, false, '{"night": 3}'),
('survive_night_4', 'ach_survive_n4', 'ach_survive_n4_desc', '🌙', 'survival', 30, false, '{"night": 4}'),
('survive_night_5', 'ach_survive_n5', 'ach_survive_n5_desc', '⭐', 'survival', 50, false, '{"night": 5}'),
('survive_night_6', 'ach_survive_n6', 'ach_survive_n6_desc', '💀', 'survival', 75, false, '{"night": 6}'),
('survive_night_7_2020', 'ach_2020_mode', 'ach_2020_mode_desc', '🏆', 'survival', 200, false, '{"night": 7, "custom": [20,20,20,20]}'),
('power_saver', 'ach_power_saver', 'ach_power_saver_desc', '🔋', 'skills', 20, false, '{"min_power": 50}'),
('no_power_survive', 'ach_no_power', 'ach_no_power_desc', '🌑', 'skills', 30, true, '{"survived_powerout": true}'),
('no_cameras', 'ach_no_cameras', 'ach_no_cameras_desc', '📵', 'skills', 40, false, '{"no_cameras": true}'),
('first_pizza', 'ach_first_pizza', 'ach_first_pizza_desc', '🍕', 'collectibles', 5, false, '{"pizza_count": 1}'),
('pizza_master', 'ach_pizza_master', 'ach_pizza_master_desc', '🍕', 'collectibles', 50, false, '{"pizza_count": 8}'),
('photographer', 'ach_photographer', 'ach_photographer_desc', '📸', 'photos', 15, false, '{"photos": 10}'),
('rare_shot', 'ach_rare_shot', 'ach_rare_shot_desc', '📷', 'photos', 75, true, '{"photo_golden_freddy": true}'),
('golden_freddy_seen', 'ach_golden', 'ach_golden_desc', '🐻', 'secrets', 100, true, '{"golden_freddy": true}'),
('all_minigames', 'ach_arcade_master', 'ach_arcade_master_desc', '🕹️', 'minigames', 40, false, '{"minigames_completed": 3}'),
('speed_demon', 'ach_speed_demon', 'ach_speed_demon_desc', '⚡', 'skills', 35, false, '{"time_under": 300}'),
('marathon', 'ach_marathon', 'ach_marathon_desc', '🏃', 'survival', 60, false, '{"survival_time": 600}')
ON CONFLICT (id) DO NOTHING;
