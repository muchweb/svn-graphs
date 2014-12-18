SOURCES=src/SVNGraphs.coffee
LIBS=lib/SVNGraphs.js

COMPILER_COFFEE=./node_modules/.bin/coffee

all: $(LIBS)

$(COMPILER_COFFEE):
	npm install

$(LIBS): $(SOURCES) $(COMPILER_COFFEE)
	mkdir -p lib
	$(COMPILER_COFFEE) --compile --output lib src

clean:
	rm -r lib
