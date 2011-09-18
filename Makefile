make-css:
	cd source/media && compass compile

regen:
	emacsclient --eval "(let ((org-confirm-babel-evaluate nil)) (org-publish-project \"blog\" t))"
	jekyll

gen:
	emacsclient --eval "(let ((org-confirm-babel-evaluate nil)) (org-publish-project \"blog\"))"
	jekyll

all: make-css gen
