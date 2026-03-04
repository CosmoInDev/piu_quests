export interface User {
  id: string;
  google_id: string;
  name: string;
  created_at: string;
}

export interface Quest {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  charts: Chart[];
}

export interface Chart {
  id: string;
  quest_id: string;
  song_name: string;
  difficulty: string;
  order: number;
}

export interface Participant {
  id: string;
  user_id: string;
  quest_id: string;
  joined_at: string;
  status: "FINISHED" | "SUBMITTING" | "UNSUBMITTED";
}

export interface Photo {
  id: number;
  record_item_id: number;
  file_url: string;
  created_at: string;
}

export interface RecordItem {
  id: number;
  record_id: number;
  chart_id: number;
  song_name: string;
  difficulty: string;
  score: number;
  created_at: string;
  photo: Photo | null;
}

export interface Record {
  id: number;
  user_id: number;
  quest_id: number;
  created_at: string;
  updated_at: string;
  items: RecordItem[];
}

export interface PhotoAnalysisResult {
  file_url: string;
  extracted_song_name: string | null;
  extracted_difficulty: string | null;
  extracted_score: number | null;
  matched_chart_id: number | null;
}
