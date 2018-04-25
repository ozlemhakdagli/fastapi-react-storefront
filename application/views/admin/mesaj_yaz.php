      <br><br>  <div class="col-md-9">
          <div class="box box-primary">
            <div class="box-header with-border">
               
              <h3 class="box-title">Yeni Mesaj Gönder</h3>
            </div>
            <form action="<?=base_url()?>admin/mesajlar/mesaj_ekle" method="post">
            <!-- /.box-header -->
            <div class="form-group">
                  
              Adı Soyadı: <input type="text" name="adsoy"  required="required" value="<?=$veri[0]->adsoy ?>">
              </div>
            <div class="box-body">
              <div class="form-group">
                  
              Kime: <input type="email" name="email"  required="required" value="<?=$veri[0]->email ?>">
              </div>
              <div class="form-group">
              Konu: <input type="text" name="konu"  required="required" value="">
              </div>
              <script src="<?=base_url()?>ckeditor/ckeditor.js" ></script>
				<div class="form-group">
				 <label>Mesaj</label><br>
				<textarea name="mesaj" id="mesaj" rows="10" cols="150"></textarea>
				<script>CKEDITOR.replace('mesaj');</script>
				</div>
                <div class="form-group">
              <input type="submit" name="submit" class="btn btn-primary pull-right" value="Gönder">
              </div>
              
            </div>
            <!-- /.box-body -->
          
            <!-- /.box-footer -->
          </div>
          <!-- /. box -->
        </div>