OUTPUT ?= ./gen

VARIANT ?= go

PROTOC ?= protoc

FLAGS+= --$(VARIANT)_out=plugins=grpc:$(OUTPUT)

SUFFIX:= pb.go

DEPS:= $(shell find . -type f -name '*.proto' | sed "s/proto$$/$(SUFFIX)/")

all: $(DEPS)

%.$(SUFFIX): %.proto
	mkdir -p $(OUTPUT)
	$(PROTOC) $(FLAGS) $*.proto

install: all
	cp -r $(OUTPUT)/* $(GOPATH)/src

clean:
	$(RM) -r $(OUTPUT)
