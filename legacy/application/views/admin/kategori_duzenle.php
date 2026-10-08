		<div class="box-header with-border">
              <h2 align="center" font-weight=" bold">Kategori Düzenleme Formu</h2>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/home/guncellekaydet/<?=$veri[0]->Id?>" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1"> Kategori Adı</label>
                  <input type="text"  name="adi" value="<?=$veri[0]->adi?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">Açıklama</label>
                  <input type="text" name="aciklama" value="<?=$veri[0]->aciklama?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Keywords</label>
                  <input type="text" name="keywords" value="<?=$veri[0]->keywords?>" class="form-control" id="exampleInputPassword1">
                </div>
                
				
				
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Güncelle</button>
             </div>
            </form>
          
    
  
