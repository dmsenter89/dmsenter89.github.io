#!/bin/bash

jupyter nbconvert tabula_analysis.ipynb --to markdown --NBConverterApp.output_files_dir=.

cat tabula_analysis.md | tee -a index.md

rm tabula_analysis.md
