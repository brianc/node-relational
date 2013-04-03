TESTS = $(shell find test -name "*.test.js")

test:
	mocha $(TESTS)

.PHONY: test
