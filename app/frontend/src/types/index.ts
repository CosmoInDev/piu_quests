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

export interface Record {
  id: string;
  user_id: string;
  quest_id: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  record_id: string;
  chart_id: string;
  file_url: string;
  created_at: string;
}
