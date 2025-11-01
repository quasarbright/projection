# Project Display

In the parent directory, I have lots of little javascript projects. Many of them are interactive math visualizations. Right now, they are presented in ../index.md, which is just a markdown file. I have a section for each project, which includes a title, description, and a screenshot.

This layout is not ideal. I would like a more modern, compact, card-based layout, and metadata like tags and creation date. I'd also like a search bar.

I want this to be a static site generator where I have one file that describes all projects and a gallery is generated from that.

Project metadata: title, description, creation date, tags, page link, screenshot link.

It should support relative links (relative to the p5js parent directory) and hyperlinks

Each card should show the picture (or a default picture) and under that, the title, creation date, and tags.

Clicking on a card should take you to the page in a new tab. There should also be an info button on the card which should pop up a more detailed view in a modal over the gallery, showing more info like the description.