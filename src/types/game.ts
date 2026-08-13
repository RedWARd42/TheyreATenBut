export interface Answer {
  memberName: string;
  rating: number;
}

export interface Question {
  id: string;
  trait: string;
  answers: Answer[];
}

export interface QuestionsData {
  questions: Question[];
}

export interface TeamMember {
  name: string;
  image: string;
}

export interface TeamMembersData {
  teamMembers: TeamMember[];
}

export interface GameRound {
  question: Question;
  memberName: string;
  rating: number;
  image: string;
}