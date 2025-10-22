# Usage Examples

## Basic Usage

### Simple Image Generation

Generate a basic image using the slash command:

```
/replicate a serene mountain landscape at sunset
```

### Detailed Prompt

Use detailed prompts for better results:

```
/replicate a photorealistic portrait of a cyberpunk character with neon lights, highly detailed, 8k resolution, dramatic lighting
```

## Advanced Usage

### Using Different Models

Configure different models in the settings panel for various styles:

**FLUX.1 Schnell** (Fast generation):
- Best for: Quick iterations, testing prompts
- Speed: ~5-10 seconds
- Quality: High

**FLUX.1 Dev** (High quality):
- Best for: Final outputs, detailed images
- Speed: ~15-30 seconds
- Quality: Very High

**Stable Diffusion XL**:
- Best for: Classic SD style, wide compatibility
- Speed: ~10-20 seconds
- Quality: High

### Prompt Engineering Tips

#### Good Prompts

✅ **Specific and descriptive:**
```
/replicate a majestic dragon perched on a cliff overlooking a medieval castle, golden hour lighting, fantasy art style, highly detailed scales
```

✅ **Include style keywords:**
```
/replicate portrait of a wise old wizard, oil painting style, rembrandt lighting, warm colors, detailed facial features
```

✅ **Specify quality:**
```
/replicate futuristic cityscape at night, cyberpunk aesthetic, neon lights, 8k, ultra detailed, cinematic composition
```

#### Prompts to Avoid

❌ **Too vague:**
```
/replicate a picture
```

❌ **Contradictory:**
```
/replicate a realistic cartoon character
```

❌ **Too many concepts:**
```
/replicate a dragon fighting a robot in space while a wizard casts spells near a castle with aliens watching
```

## Integration Examples

### Using with Character Cards

Generate character portraits:

```
/replicate portrait of {{char}}, {{char_description}}, professional photography, studio lighting
```

### Using with Story Context

Generate scene illustrations:

```
/replicate {{last_message}}, digital art, detailed background, atmospheric lighting
```

### Batch Generation

Generate multiple variations by adjusting "Number of Images" in settings, then:

```
/replicate a fantasy tavern interior, warm lighting, detailed
```

This will generate multiple variations of the same prompt.

## API Usage Examples

### JavaScript/Node.js

```javascript
// Generate an image
const response = await fetch('http://localhost:8000/api/plugins/replicate/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'a beautiful landscape',
    model: 'black-forest-labs/flux-schnell',
    width: 1024,
    height: 1024,
    num_outputs: 1
  })
});

const result = await response.json();
console.log('Generated images:', result.images);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:8000/api/plugins/replicate/generate',
    json={
        'prompt': 'a beautiful landscape',
        'model': 'black-forest-labs/flux-schnell',
        'width': 1024,
        'height': 1024,
        'num_outputs': 1
    }
)

result = response.json()
print('Generated images:', result['images'])
```

### cURL

```bash
curl -X POST http://localhost:8000/api/plugins/replicate/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful landscape",
    "model": "black-forest-labs/flux-schnell",
    "width": 1024,
    "height": 1024,
    "num_outputs": 1
  }'
```

## Settings Configurations

### Fast Generation (Quick Previews)

```
Model: FLUX.1 Schnell
Width: 512
Height: 512
Inference Steps: 20
Guidance Scale: 7.0
```

### High Quality (Final Output)

```
Model: FLUX.1 Dev
Width: 1024
Height: 1024
Inference Steps: 50
Guidance Scale: 7.5
```

### Portrait Mode

```
Width: 768
Height: 1024
Guidance Scale: 8.0
Inference Steps: 40
```

### Landscape Mode

```
Width: 1024
Height: 768
Guidance Scale: 7.5
Inference Steps: 40
```

### Square (Social Media)

```
Width: 1024
Height: 1024
Guidance Scale: 7.5
Inference Steps: 40
```

## Use Cases

### 1. Character Visualization

Generate visual representations of your characters:

```
/replicate full body portrait of a female elf ranger, long silver hair, green eyes, leather armor, bow and quiver, forest background, fantasy art
```

### 2. Scene Setting

Create atmospheric scenes for your stories:

```
/replicate ancient library interior, towering bookshelves, magical floating books, warm candlelight, mystical atmosphere, detailed architecture
```

### 3. Item Visualization

Generate images of items or objects:

```
/replicate legendary sword with glowing runes, ornate hilt, fantasy weapon, detailed metalwork, dramatic lighting
```

### 4. Concept Art

Create concept art for your narratives:

```
/replicate concept art of a floating sky city, steampunk aesthetic, airships, clouds, detailed architecture, golden hour lighting
```

### 5. Mood Boards

Generate atmospheric references:

```
/replicate dark gothic castle on a stormy night, lightning, ominous atmosphere, dramatic clouds, cinematic
```

## Troubleshooting Examples

### If Generation is Too Slow

Reduce inference steps:
```
Inference Steps: 20-30 (instead of 50)
```

### If Images Don't Match Prompt

Increase guidance scale:
```
Guidance Scale: 9-12 (instead of 7.5)
```

### If Images Look Blurry

Increase inference steps:
```
Inference Steps: 60-80
```

### If You Need Variations

Generate multiple outputs:
```
Number of Images: 4
```

## Best Practices

1. **Start Simple**: Begin with basic prompts and refine
2. **Use Keywords**: Include style, quality, and lighting keywords
3. **Be Specific**: Describe exactly what you want to see
4. **Iterate**: Generate multiple versions and refine your prompt
5. **Save Good Prompts**: Keep a collection of prompts that work well
6. **Adjust Settings**: Different subjects need different settings
7. **Check Examples**: Look at successful prompts on Replicate's website

## Resources

- [Replicate Model Gallery](https://replicate.com/explore)
- [Prompt Engineering Guide](https://replicate.com/docs)
- [FLUX.1 Documentation](https://replicate.com/black-forest-labs/flux-schnell)
- [Stable Diffusion Tips](https://replicate.com/stability-ai/sdxl)