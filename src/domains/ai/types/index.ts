export interface TriggerAnalysisInput {
  projectId: string;
  referenceType: string;
  referenceId: string;
  analysisType: string;
}

export interface SendMessageInput {
  conversationId?: string;
  projectId: string;
  content: string;
}
