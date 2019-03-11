/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import MentionEditing from '../src/mentionediting';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import { getData as getModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

describe( 'MentionEditing', () => {
	testUtils.createSinonSandbox();

	it( 'should be named', () => {
		expect( MentionEditing.pluginName ).to.equal( 'MentionEditing' );
	} );

	describe( 'init()', () => {
		let editor, model, doc;

		it( 'should be loaded', () => {
			return createTestEditor()
				.then( newEditor => {
					expect( newEditor.plugins.get( MentionEditing ) ).to.be.instanceOf( MentionEditing );
				} );
		} );

		it( 'should set proper schema rules', () => {
			return createTestEditor()
				.then( newEditor => {
					model = newEditor.model;

					expect( model.schema.checkAttribute( [ '$root', '$text' ], 'mention' ) ).to.be.true;

					expect( model.schema.checkAttribute( [ '$block', '$text' ], 'mention' ) ).to.be.true;
					expect( model.schema.checkAttribute( [ '$clipboardHolder', '$text' ], 'mention' ) ).to.be.true;

					expect( model.schema.checkAttribute( [ '$block' ], 'mention' ) ).to.be.false;
				} );
		} );

		describe( 'conversion in the data pipeline', () => {
			beforeEach( () => {
				return createTestEditor()
					.then( newEditor => {
						editor = newEditor;
						model = editor.model;
						doc = model.document;
					} );
			} );

			it( 'should convert <span class="mention" data-mention="John"> to mention attribute', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );

				expect( getModelData( model, { withoutSelection: true } ) )
					.to.equal( '<paragraph>foo <$text mention="John">John</$text> bar</paragraph>' );

				expect( editor.getData() ).to.equal( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );
			} );

			it( 'should remove mention on adding a text inside mention', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );

				model.change( writer => {
					const paragraph = doc.getRoot().getChild( 0 );

					writer.setSelection( paragraph, 5 );

					writer.insertText( 'a', doc.selection.getAttributes(), writer.createPositionAt( paragraph, 6 ) );
				} );

				expect( editor.getData() ).to.equal( '<p>foo Joahn bar</p>' );
			} );

			it( 'should remove mention on removing a text inside mention', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );

				model.change( writer => {
					const paragraph = doc.getRoot().getChild( 0 );

					writer.setSelection( paragraph, 5 );

					writer.remove( writer.createRange( writer.createPositionAt( paragraph, 5 ), writer.createPositionAt( paragraph, 6 ) ) );
				} );

				expect( editor.getData() ).to.equal( '<p>foo Jhn bar</p>' );
			} );

			it( 'should remove mention on removing a text at the and of a mention', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );

				const paragraph = doc.getRoot().getChild( 0 );

				// Set selection at the end of a John.
				model.change( writer => {
					writer.setSelection( paragraph, 8 );
				} );

				model.change( writer => {
					writer.remove( writer.createRange( writer.createPositionAt( paragraph, 7 ), writer.createPositionAt( paragraph, 8 ) ) );
				} );

				expect( editor.getData() ).to.equal( '<p>foo Joh bar</p>' );
			} );

			it( 'should work on insert text to an empty node', () => {
				editor.setData( '<p></p>' );

				model.change( writer => {
					const paragraph = doc.getRoot().getChild( 0 );

					writer.insertText( 'foo', paragraph, 0 );
				} );

				expect( editor.getData() ).to.equal( '<p>foo</p>' );
			} );

			it( 'should remove mention attribute from a selection if selection is on right side of a mention', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span>bar</p>' );

				model.change( writer => {
					const paragraph = doc.getRoot().getChild( 0 );

					writer.setSelection( paragraph, 8 );
				} );

				expect( Array.from( doc.selection.getAttributes() ) ).to.deep.equal( [] );
			} );

			it( 'should allow to type after a mention', () => {
				editor.setData( '<p>foo <span class="mention" data-mention="John">John</span>bar</p>' );

				model.change( writer => {
					const paragraph = doc.getRoot().getChild( 0 );

					writer.setSelection( paragraph, 8 );

					writer.insertText( ' ', paragraph, 8 );
				} );

				expect( editor.getData() ).to.equal( '<p>foo <span class="mention" data-mention="John">John</span> bar</p>' );
			} );
		} );
	} );

	function createTestEditor( mentionConfig ) {
		return VirtualTestEditor
			.create( {
				plugins: [ Paragraph, MentionEditing ],
				mention: mentionConfig
			} );
	}
} );
