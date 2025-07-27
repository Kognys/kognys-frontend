import { useState } from 'react';
import { EnhancedAgentMessage, EnhancedAgentThreadContainer } from './EnhancedAgentMessage';
import { EnhancedPhaseIndicator, PhaseProgress } from './EnhancedPhaseIndicator';
import { AgentInteractionMessage } from '@/types/agentInteraction';
import { Button } from './ui/button';

export const UIShowcase = () => {
  const [currentPhase, setCurrentPhase] = useState<'research' | 'validation' | 'synthesis' | 'critique' | 'finalize'>('validation');
  
  // Sample messages showcasing the new features
  const sampleMessages: AgentInteractionMessage[] = [
    {
      id: '1',
      agentName: 'Input Validator',
      agentRole: 'Validation Expert',
      content: `I've validated and refined your question to: "What are the most significant recent advancements and novel applications of artificial intelligence across various industries?"

I've optimized the search queries for each data source:

OpenAlex: ("artificial intelligence" OR AI) AND (advancements OR applications OR "novel applications") AND (industry OR industries)

Semantic Scholar: ("artificial intelligence" | AI) + (advancements | applications | "novel applications") + (industry | industries) year:2022-

arXiv: all:("artificial intelligence" OR AI) AND (ti:(advancements OR applications) OR abs:(advancements OR applications OR "novel applications")) AND (ti:(industry OR industries) OR abs:(industry OR industries))`,
      messageType: 'analyzing',
      targetAgent: 'Document Retriever',
      isHighlighted: false
    },
    {
      id: '2',
      agentName: 'Document Retriever',
      agentRole: 'Search Specialist',
      content: `Found 19 results

Hmm, let's tackle this user question about recent AI advancements and applications. First, I need to go through the search results thoroughly to extract the most relevant information. The user is asking for significant advancements and novel applications across various industries, so I should organize the findings by sector.

Starting with **healthcare**:
1. AI in clinical operations, like streamlining documentation and claims processing.
2. AI systems interpreting medical scans more accurately than specialists and brain-computer interfaces converting thoughts to text. The Nobel Prize for AlphaFold is noted in 6, which I...`,
      messageType: 'thinking',
      targetAgent: 'Research Synthesizer',
      isHighlighted: false
    },
    {
      id: '3',
      agentName: 'Research Synthesizer',
      agentRole: 'Synthesis Expert',
      content: `Based on the comprehensive research, I've identified the following significant recent AI advancements across industries:

## Healthcare & Life Sciences
- **AlphaFold's Nobel Prize (2024)**: Revolutionary protein structure prediction enabling drug discovery
- **AI Medical Imaging**: Systems now outperform specialists in scan interpretation
- **Brain-Computer Interfaces**: Direct thought-to-text conversion for paralyzed patients

## Financial Services
- **Real-time Fraud Detection**: ML models processing millions of transactions instantly
- **Algorithmic Trading**: AI systems managing 70% of stock market trades
- **Personalized Banking**: AI-driven financial advice and credit scoring

## Manufacturing & Industry
- **Predictive Maintenance**: 30% reduction in downtime through AI monitoring
- **Quality Control**: Computer vision detecting defects with 99.9% accuracy
- **Supply Chain Optimization**: AI reducing logistics costs by 15-20%`,
      messageType: 'concluding',
      targetAgent: 'Critical Challenger',
      isHighlighted: true
    },
    {
      id: '4',
      agentName: 'Critical Challenger',
      agentRole: 'Review Specialist',
      content: `I notice several areas that need deeper exploration:

1. **Emerging Technologies**: What about quantum-AI hybrid systems or neuromorphic computing?
2. **Ethical Implications**: The synthesis lacks discussion of AI bias and regulatory challenges
3. **Regional Variations**: How do these advancements differ across global markets?
4. **Implementation Barriers**: What are the practical challenges organizations face?

Requesting additional research on these critical gaps.`,
      messageType: 'analyzing',
      targetAgent: 'Research Orchestrator',
      isHighlighted: false
    }
  ];

  const phases: Array<'research' | 'validation' | 'synthesis' | 'critique' | 'finalize'> = 
    ['research', 'validation', 'synthesis', 'critique', 'finalize'];

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Enhanced UI Components Showcase</h2>
      
      {/* Phase Indicators */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Phase Indicators with Color Coding</h3>
        <div className="flex flex-wrap gap-4">
          {phases.map(phase => (
            <EnhancedPhaseIndicator 
              key={phase}
              phase={phase} 
              iterationNumber={phase === 'critique' ? 1 : undefined}
            />
          ))}
        </div>
      </div>

      {/* Phase Progress Bar */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Phase Progress Tracker</h3>
        <PhaseProgress currentPhase={currentPhase} />
        <div className="flex gap-2">
          {phases.map(phase => (
            <Button
              key={phase}
              variant={currentPhase === phase ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPhase(phase)}
            >
              {phase}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent Messages with Enhanced Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agent Messages with Color-Coded Borders & Collapsible Sections</h3>
        <div className="bg-muted/20 rounded-lg p-6">
          <EnhancedAgentThreadContainer messages={sampleMessages} />
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-950/30">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Color-Coded Agents</h4>
          <p className="text-sm opacity-80">Each agent type has a unique color scheme for instant recognition</p>
        </div>
        <div className="p-4 rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
          <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Opacity Hierarchy</h4>
          <p className="text-sm opacity-80">Text opacity indicates importance and message type</p>
        </div>
        <div className="p-4 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30">
          <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Collapsible Sections</h4>
          <p className="text-sm opacity-80">Complex queries and results can be collapsed for cleaner view</p>
        </div>
      </div>
    </div>
  );
};