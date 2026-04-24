---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Calculating Grades with SAS ODA"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-03T09:46:42-04:00
lastmod: 2021-06-03T09:46:42-04:00
featured: false
draft: true

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

Calculating grades, in particular the final course grade, is an important
but often tedious task. While many classroom technologies make teaching easier,
some can make grading more difficult or time consuming for the grader.
This past year I was teaching a math course that utilized Pearson's MyLab Math 
for homework assignments, before class assignments, and in-class assigments - all
of which were weighted differently for purposes of calculating the final course
grade. Exams on the other hand were handled via Gradescope. The class website
was hosted on SAKAI, and incidentally a class project was returned and graded on 
SAKAI. So we have three different sources of grade information that all need to be
combined in the end and preferably posted back to SAKAI for students to view. 
At the end of the semester, several lowest scores are dropped, so that has to be
accounted for as well.

In my experience, many instructors rely on tables using Excel or Google Sheets to
handle all of their grading. But this requires a surprising amount of manual
intervention as some of the course scores get updated throughout the semester. If
more than just one or two students drop the course, the change in rows can really
through off your work. If an instructor were using SAS code to do all the grading,
we could avoid a lot of the manual part by front-loading it. We'd write a SAS script
to load in and merge all of the data so there would be a lot less work to do once grades
are updated or students dropped from the course. In addition, using SAS gives us access 
to its advanced features if we are interested in getting more information about our
students' performance, which is especially useful when teaching multiple sections. 
This post will walk you through writing your own code using SAKAI, Gradescope, and MyLab
Math grade CSVs as examples.
