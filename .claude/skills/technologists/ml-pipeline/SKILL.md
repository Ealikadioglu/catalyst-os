---
name: ml-pipeline
description: >
  Build machine learning pipelines and model integrations. Use when
  implementing ML features or creating data pipelines.
agent: necromancer
---

# ML Pipeline

Build machine learning pipelines.

## When to Use

- Implementing ML features
- Creating data pipelines
- Model serving

## Process

1. **Define pipeline**
   - Data sources
   - Processing steps
   - Model inference
   - Output handling

2. **Implement components**
   - Data loaders
   - Preprocessors
   - Model wrappers

3. **Test pipeline**
   - Unit test components
   - Integration test flow

## Pipeline Pattern

```python
class MLPipeline:
    def __init__(self):
        self.processor = DataProcessor()
        self.model = ModelWrapper("model.pkl")
    
    def run(self, source: str):
        data = self.processor.load(source)
        processed = self.processor.preprocess(data)
        return self.model.predict(processed)
```

## Checklist

- [ ] Data loading tested
- [ ] Preprocessing validated
- [ ] Model wrapped
- [ ] Error handling
