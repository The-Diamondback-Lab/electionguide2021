## Format

Each text file follows the format below (less the "comments")

```text
CANDIDATE_NAME  # [string]
CANDIDATE_ID    # [string]
POSITION        # [string] District number candidate is running for or a mayoral position
IS_INCUMBENT    # [boolean] Whether or not this candidate is an incumbent
PARA_1
PARA_2
...
```

## Why not JSON?

Each author's biography was copied and pasted straight from a document (hence why one can see the unusual quote characters). In some cases, a (normal) double quote would appear in the text, making it slightly more annoying to escape for JSON. As such, it was more convenient to enter the text into a text file, since there's no syntax.
