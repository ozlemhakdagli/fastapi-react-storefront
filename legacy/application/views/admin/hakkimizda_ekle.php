

 <div class="box box-primary">
   <div class="col-xs-8">
            <div class="box-header with-border">
              <h3 class="box-title">Hakkımızda Bilgisi </h3>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/home/hakkimizda_guncelle/<?=$veri[0]->Id?>" method="post">
              <div class="box-body">
				
                
				<script src="<?=base_url()?>ckeditor/ckeditor.js" ></script>
				<div class="form-group">
				 <label>Hakkımızda</label><br>
				<textarea name="hakkimizda" id="hakkimizda" rows="10" cols="150"><?=$veri[0]->hakkimizda?></textarea>
				<script>CKEDITOR.replace('hakkimizda');</script>
				</div>
              </div>
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Kaydet</button>
             
            </form>
          </div>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
