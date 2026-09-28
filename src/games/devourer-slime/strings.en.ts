/** English UI text of Devourer Slime 3D (catalog scope `devourerSlime`). */
export default {
  devourerSlime: {
    title: 'Devourer Slime',
    pitch: 'Eat the words in order and grow.',
    subtitle: 'Forest clearing',
    briefing: {
      objective: 'Eat the words of each sentence in order and grow big.',
      instructions: {
        read: { title: 'Read the sentence', description: 'Word bubbles float in the clearing: the words of a sentence from the story.' },
        eat: { title: 'Eat them in order', description: 'The first word first. Every right word makes the slime bigger.' },
        gulp: { title: 'Gulp the guards', description: 'When the slime is bigger than a guard, it can swallow the guard!' },
      },
      controls: {
        touch: { label: 'Hold and drag', action: 'Move toward your finger' },
        pointer: { label: 'WASD or arrows', action: 'Move' },
      },
      learningPreview: 'Sentences from your story',
      tip: 'A wrong word bounces away. Big guards push you back, but you never lose.',
      start: 'Start munching 🟢',
    },
    hud: {
      place: 'Forest clearing',
      sentence: 'Sentence {index}/{total}',
      size: 'Size',
      story: '📖 Story',
      move: 'Drag to move',
      yum: 'Yum!',
      bleh: 'Bleh!',
      oof: 'Oof!',
      gulp: 'Gulp! +{coins}',
      done: { title: 'What a big slime!', text: 'The slime ate every sentence.' },
    },
  },
} as const;
