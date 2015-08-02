#!/bin/bash

#define path to closure compiler here
CC_PATH="/home/moritz/Apps/closurecompiler/compiler.jar"

if  [ -z ${CC_PATH+x} ]; then
  echo "undefined path to closure compiler"
  echo "define a valid path and rerun the script"
  exit 1
fi

java -jar $CC_PATH --formatting PRETTY_PRINT --js_output_file=../../libs/jsonMEdit.js --compilation_level=SIMPLE ../../src/interfaces/Interface.js ../../src/interfaces/IEventHandler.js ../../src/interfaces/IEditor.js ../../src/interfaces/IEditorProvider.js ../../src/EventHandler.js ../../src/JSONNullEditor.js ../../src/JSONNumberEditor.js ../../src/JSONBooleanEditor.js ../../src/JSONObjectEditor.js ../../src/JSONArrayEditor.js ../../src/SimpleStringEditor.js ../../src/jsonEditor.js ../../src/DefaultJSONEditorProvider.js
